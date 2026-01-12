#!/usr/bin/env python3
"""
Script mejorado para extraer iconos de alérgenos de una imagen.
Detecta círculos precisos y recorta solo el contenido sin fondo ni material extra.
"""

import os
import sys
import argparse
from PIL import Image
import numpy as np

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False
    print("⚠️  OpenCV no está instalado. Instálalo con: pip install opencv-python numpy pillow")
    print("   Usando método básico...")

# Mapeo de posiciones a nombres de alérgenos
ALLERGEN_NAMES = {
    (0, 0): "huevos",
    (0, 1): "pescado",
    (0, 2): "gluten",
    (0, 3): "leche",
    (1, 0): "lacteos",
    (1, 1): "cacahuetes",
    (1, 2): "sulfitos",
    (1, 3): "soja",
    (2, 0): "legumbres",
    (2, 1): "gluten-alt",
    (2, 2): "marisco",
    (2, 3): "moluscos",
    (3, 0): "gluten-alt2",
    (3, 1): "marisco-alt",
    (3, 2): "moluscos-alt",
    (3, 3): "moluscos-alt2",
}


def detect_circle_precise(img_gray, x_approx, y_approx, radius_approx):
    """
    Detecta el círculo preciso alrededor de una posición aproximada.
    """
    # Crear ROI alrededor de la posición aproximada
    margin = int(radius_approx * 0.5)
    x_min = max(0, int(x_approx - radius_approx - margin))
    y_min = max(0, int(y_approx - radius_approx - margin))
    x_max = min(img_gray.shape[1], int(x_approx + radius_approx + margin))
    y_max = min(img_gray.shape[0], int(y_approx + radius_approx + margin))
    
    roi = img_gray[y_min:y_max, x_min:x_max]
    
    if roi.size == 0:
        return None
    
    # Detectar círculos en el ROI
    circles = cv2.HoughCircles(
        roi,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=radius_approx * 2,
        param1=50,
        param2=30,
        minRadius=int(radius_approx * 0.8),
        maxRadius=int(radius_approx * 1.2)
    )
    
    if circles is not None and len(circles[0]) > 0:
        # Tomar el círculo más cercano al centro del ROI
        circle = circles[0][0]
        x, y, r = circle
        # Ajustar coordenadas al frame original
        return (x + x_min, y + y_min, r)
    
    return None


def extract_circular_icon_precise(img, center_x, center_y, radius, padding=1):
    """
    Extrae un icono circular con precisión, eliminando el fondo negro.
    
    Args:
        img: Imagen BGR de OpenCV
        center_x, center_y: Centro del círculo
        radius: Radio del círculo
        padding: Padding adicional alrededor del círculo
    
    Returns:
        Imagen PIL con el icono recortado y fondo transparente
    """
    height, width = img.shape[:2]
    
    # Calcular tamaño del recorte (solo el círculo + padding mínimo)
    size = int((radius + padding) * 2)
    half_size = size // 2
    
    # Calcular coordenadas del recorte
    x1 = max(0, int(center_x - half_size))
    y1 = max(0, int(center_y - half_size))
    x2 = min(width, int(center_x + half_size))
    y2 = min(height, int(center_y + half_size))
    
    # Asegurar tamaño mínimo
    actual_w = x2 - x1
    actual_h = y2 - y1
    
    if actual_w < size:
        if x1 == 0:
            x2 = min(width, x1 + size)
        else:
            x1 = max(0, x2 - size)
    
    if actual_h < size:
        if y1 == 0:
            y2 = min(height, y1 + size)
        else:
            y1 = max(0, y2 - size)
    
    # Recortar región
    cropped = img[y1:y2, x1:x2].copy()
    cropped_h, cropped_w = cropped.shape[:2]
    
    # Convertir a RGB
    if len(cropped.shape) == 2:
        cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_GRAY2RGB)
    else:
        cropped_rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB)
    
    # Crear máscara circular para el borde exterior
    circle_mask = np.zeros((cropped_h, cropped_w), dtype=np.uint8)
    rel_center_x = center_x - x1
    rel_center_y = center_y - y1
    cv2.circle(circle_mask, (int(rel_center_x), int(rel_center_y)), int(radius), 255, -1)
    
    # Detectar fondo negro: píxeles con valores muy bajos en RGB
    # Usar umbral más agresivo para detectar negros
    threshold = 50
    r_channel = cropped_rgb[:, :, 0]
    g_channel = cropped_rgb[:, :, 1]
    b_channel = cropped_rgb[:, :, 2]
    
    # Un píxel es fondo negro si todos los canales RGB son < umbral
    is_black = (r_channel < threshold) & (g_channel < threshold) & (b_channel < threshold)
    
    # Crear máscara de fondo negro (dentro del círculo)
    background_mask = (is_black.astype(np.uint8) * 255) & circle_mask
    
    # Crear canal alpha: opaco para contenido, transparente para fondo negro
    alpha = np.ones((cropped_h, cropped_w), dtype=np.uint8) * 255
    
    # Hacer transparente el fondo negro
    alpha[background_mask > 0] = 0
    
    # Aplicar máscara circular al alpha (fuera del círculo = transparente)
    alpha = alpha & circle_mask
    
    # Suavizar bordes del círculo para anti-aliasing
    circle_mask_blur = cv2.GaussianBlur(circle_mask.astype(np.float32), (5, 5), 0) / 255.0
    alpha_float = alpha.astype(np.float32) / 255.0
    alpha_smooth = (alpha_float * circle_mask_blur * 255).astype(np.uint8)
    
    # También suavizar la transición del fondo negro
    # Crear máscara suave para el fondo negro
    background_mask_blur = cv2.GaussianBlur(background_mask.astype(np.float32), (3, 3), 0) / 255.0
    # Reducir alpha donde hay fondo negro
    alpha_smooth = (alpha_smooth.astype(np.float32) * (1 - background_mask_blur * 0.9)).astype(np.uint8)
    
    # Combinar RGB + Alpha
    rgba = np.dstack([cropped_rgb, alpha_smooth])
    
    # Convertir a PIL
    icon_pil = Image.fromarray(rgba, 'RGBA')
    
    return icon_pil


def extract_icons_smart(image_path: str, output_dir: str = "public/assets/allergens"):
    """
    Extrae iconos usando detección inteligente de círculos.
    """
    if not HAS_OPENCV:
        print("❌ OpenCV es requerido para la extracción inteligente.")
        print("   Instálalo con: pip install opencv-python numpy pillow")
        sys.exit(1)
    
    # Crear directorio de salida
    os.makedirs(output_dir, exist_ok=True)
    
    # Cargar imagen
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        print(f"❌ Error: No se pudo cargar la imagen desde {image_path}")
        sys.exit(1)
    
    height, width = img_bgr.shape[:2]
    print(f"📐 Imagen original: {width}x{height}")
    
    # Convertir a escala de grises
    img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Detectar círculos principales
    # Estimar tamaño aproximado de cada círculo
    estimated_radius = min(width, height) // 8
    
    print(f"🔍 Detectando círculos (radio estimado: {estimated_radius}px)...")
    
    circles = cv2.HoughCircles(
        img_gray,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=estimated_radius * 2,
        param1=50,
        param2=30,
        minRadius=int(estimated_radius * 0.7),
        maxRadius=int(estimated_radius * 1.3)
    )
    
    if circles is None or len(circles[0]) < 16:
        print(f"⚠️  Solo se detectaron {len(circles[0]) if circles is not None else 0} círculos. Usando método de cuadrícula mejorado...")
        return extract_icons_grid_smart(image_path, output_dir)
    
    circles = np.uint16(np.around(circles[0]))
    print(f"✅ Detectados {len(circles)} círculos")
    
    # Ordenar círculos por posición (fila, columna)
    # Agrupar por filas primero
    rows = {}
    for x, y, r in circles:
        row_idx = int(y // (height / 4))
        if row_idx not in rows:
            rows[row_idx] = []
        rows[row_idx].append((x, y, r))
    
    # Ordenar cada fila por posición X
    sorted_circles = []
    for row_idx in sorted(rows.keys()):
        row_circles = sorted(rows[row_idx], key=lambda c: c[0])
        sorted_circles.extend(row_circles)
    
    # Asegurar que tenemos exactamente 16 círculos
    if len(sorted_circles) != 16:
        print(f"⚠️  Se detectaron {len(sorted_circles)} círculos, esperados 16. Usando método de cuadrícula...")
        return extract_icons_grid_smart(image_path, output_dir)
    
    print(f"\n📦 Extrayendo {len(sorted_circles)} iconos...\n")
    
    # Extraer cada icono
    for idx, (x, y, r) in enumerate(sorted_circles):
        # Refinar detección del círculo
        precise_circle = detect_circle_precise(img_gray, x, y, r)
        if precise_circle:
            x, y, r = precise_circle
        
        # Extraer icono con precisión
        icon = extract_circular_icon_precise(img_bgr, x, y, r, padding=2)
        
        # Nombre del archivo
        row = idx // 4
        col = idx % 4
        allergen_name = ALLERGEN_NAMES.get((row, col), f"allergen_{row}_{col}")
        output_path = os.path.join(output_dir, f"{allergen_name}.png")
        
        # Guardar como PNG con transparencia
        icon.save(output_path, "PNG", optimize=True)
        print(f"✓ {allergen_name:20s} | Centro: ({x:4d}, {y:4d}) | Radio: {r:3d}px | {output_path}")
    
    print(f"\n✅ Extracción completada: {len(sorted_circles)} iconos guardados en {output_dir}")


def find_circle_in_cell(cell_gray, cell_bgr):
    """
    Encuentra el círculo más preciso en una celda usando múltiples métodos.
    """
    cell_h, cell_w = cell_gray.shape
    
    # Método 1: Detección de círculos de Hough
    estimated_radius = min(cell_w, cell_h) // 2 - 5
    
    # Intentar con diferentes parámetros para mejor detección
    for param2 in [20, 30, 40]:
        circles = cv2.HoughCircles(
            cell_gray,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=estimated_radius * 2,
            param1=50,
            param2=param2,
            minRadius=int(estimated_radius * 0.7),
            maxRadius=int(estimated_radius * 1.3)
        )
        
        if circles is not None and len(circles[0]) > 0:
            # Tomar el círculo más grande y centrado
            best_circle = None
            best_score = 0
            center_x, center_y = cell_w // 2, cell_h // 2
            
            for circle in circles[0]:
                x, y, r = circle
                # Score basado en tamaño y cercanía al centro
                distance_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
                score = r - (distance_from_center * 0.1)
                
                if score > best_score:
                    best_score = score
                    best_circle = circle
            
            if best_circle is not None:
                return best_circle
    
    # Método 2: Detección de bordes y contornos
    edges = cv2.Canny(cell_gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Encontrar el contorno más circular
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 100:  # Filtrar contornos muy pequeños
                continue
            
            # Aproximar a círculo
            (x, y), radius = cv2.minEnclosingCircle(contour)
            circularity = 4 * np.pi * area / (cv2.arcLength(contour, True) ** 2)
            
            if circularity > 0.7:  # Es bastante circular
                return (x, y, radius)
    
    # Método 3: Detección por umbral (para fondos negros)
    _, thresh = cv2.threshold(cell_gray, 10, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Encontrar el contorno más grande y circular
        largest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        
        if area > 100:
            (x, y), radius = cv2.minEnclosingCircle(largest)
            return (x, y, radius)
    
    # Fallback: usar el centro con radio estimado
    return (cell_w // 2, cell_h // 2, estimated_radius)


def extract_icons_grid_smart(image_path: str, output_dir: str = "public/assets/allergens", grid_size: tuple = (4, 4)):
    """
    Extrae iconos usando cuadrícula pero con detección inteligente del círculo dentro de cada celda.
    """
    if not HAS_OPENCV:
        print("❌ OpenCV es requerido.")
        sys.exit(1)
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Cargar imagen
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        print(f"❌ Error: No se pudo cargar la imagen desde {image_path}")
        sys.exit(1)
    
    img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    height, width = img_bgr.shape[:2]
    rows, cols = grid_size
    
    cell_width = width // cols
    cell_height = height // rows
    
    print(f"📐 Imagen: {width}x{height} | Celda: {cell_width}x{cell_height}")
    print(f"📦 Extrayendo {rows * cols} iconos con detección inteligente...\n")
    
    for row in range(rows):
        for col in range(cols):
            # Calcular posición de la celda con pequeño margen para evitar cortes
            left = col * cell_width
            top = row * cell_height
            right = left + cell_width
            bottom = top + cell_height
            
            # Extraer celda con pequeño margen adicional
            margin = 2
            cell_left = max(0, left - margin)
            cell_top = max(0, top - margin)
            cell_right = min(width, right + margin)
            cell_bottom = min(height, bottom + margin)
            
            cell_gray = img_gray[cell_top:cell_bottom, cell_left:cell_right]
            cell_bgr = img_bgr[cell_top:cell_bottom, cell_left:cell_right]
            
            # Encontrar círculo en la celda
            circle = find_circle_in_cell(cell_gray, cell_bgr)
            x_rel, y_rel, r = circle
            
            # Convertir a coordenadas absolutas
            x_abs = int(cell_left + x_rel)
            y_abs = int(cell_top + y_rel)
            radius = int(r)
            
            # Asegurar que el radio no sea demasiado grande
            max_radius = min(cell_width, cell_height) // 2 - 2
            radius = min(radius, max_radius)
            
            # Extraer icono preciso con padding mínimo
            icon = extract_circular_icon_precise(img_bgr, x_abs, y_abs, radius, padding=1)
            
            # Nombre del archivo
            allergen_name = ALLERGEN_NAMES.get((row, col), f"allergen_{row}_{col}")
            output_path = os.path.join(output_dir, f"{allergen_name}.png")
            
            # Guardar
            icon.save(output_path, "PNG", optimize=True)
            print(f"✓ {allergen_name:20s} | Centro: ({x_abs:4d}, {y_abs:4d}) | Radio: {radius:3d}px")
    
    print(f"\n✅ Extracción completada: {rows * cols} iconos guardados en {output_dir}")


def main():
    parser = argparse.ArgumentParser(
        description="Extrae iconos de alérgenos con detección inteligente de círculos"
    )
    parser.add_argument(
        "image_path",
        help="Ruta a la imagen con los iconos de alérgenos"
    )
    parser.add_argument(
        "-o", "--output",
        default="public/assets/allergens",
        help="Directorio de salida (default: public/assets/allergens)"
    )
    parser.add_argument(
        "-m", "--method",
        choices=["smart", "grid"],
        default="smart",
        help="Método: smart (detección automática) o grid (cuadrícula con detección)"
    )
    
    args = parser.parse_args()
    
    if args.method == "smart":
        extract_icons_smart(args.image_path, args.output)
    else:
        extract_icons_grid_smart(args.image_path, args.output)


if __name__ == "__main__":
    main()

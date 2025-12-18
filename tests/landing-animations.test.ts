import assert from "node:assert/strict";
import test from "node:test";

import {
  fadeInVariants,
  slideUpVariants,
  staggerContainerVariants,
  scaleOnHoverVariants,
  floatingVariants,
  createStaggerDelay,
} from "../components/landing/animation-variants";

test("fadeInVariants has correct hidden and visible states", () => {
  assert.equal(fadeInVariants.hidden.opacity, 0);
  assert.equal(fadeInVariants.visible.opacity, 1);
  assert.ok(fadeInVariants.visible.transition);
});

test("slideUpVariants moves from below to original position", () => {
  assert.equal(slideUpVariants.hidden.opacity, 0);
  assert.equal(slideUpVariants.hidden.y, 30);
  assert.equal(slideUpVariants.visible.opacity, 1);
  assert.equal(slideUpVariants.visible.y, 0);
});

test("staggerContainerVariants staggers children animations", () => {
  assert.ok(staggerContainerVariants.visible.transition);
  assert.ok(staggerContainerVariants.visible.transition.staggerChildren > 0);
});

test("scaleOnHoverVariants provides hover scale effect", () => {
  assert.ok(scaleOnHoverVariants.hover.scale > 1);
  assert.ok(scaleOnHoverVariants.tap.scale < 1);
});

test("floatingVariants creates continuous floating animation", () => {
  assert.ok(Array.isArray(floatingVariants.animate.y));
  assert.ok(floatingVariants.animate.transition.repeat === Infinity);
});

test("createStaggerDelay returns correct delay based on index", () => {
  const delay0 = createStaggerDelay(0);
  const delay1 = createStaggerDelay(1);
  const delay2 = createStaggerDelay(2);

  assert.ok(delay1 > delay0);
  assert.ok(delay2 > delay1);
  assert.equal(delay1 - delay0, delay2 - delay1);
});

test("createStaggerDelay accepts custom base delay", () => {
  const defaultDelay = createStaggerDelay(1);
  const customDelay = createStaggerDelay(1, 0.2);

  assert.notEqual(defaultDelay, customDelay);
});

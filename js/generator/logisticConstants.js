/*jshint -W079 */
"use strict";

/**
 * Constant used as parameter to stop the generation for r < LIMIT_CYCLE_2.
 *  minimum diference between a generated value and
 */
const DELTA = 1 / 10000;

/**
 * Limit value for r before the logisti series start to jump from a serie of 2 values to chaos.
 */
const LIMIT_CYCLE_2 = 1 + Math.sqrt(6);

/**
 * Indicates that a series converges to a specific value. It happens when r < 3. {@link LIMIT_CYCLE_2}.
 * @see {@link LogisticGenerator#convergenceType}
 */
const CONVERGENT = "CONVERGENCE";

/**
 * Indicates that a series converges to cycle of 2 values. It happens when 3 <= r < {@link LIMIT_CYCLE_2}.
 * @see {@link LogisticGenerator#convergenceType}
 */
const CYCLE_2 = "CYCLE_2";

/**
 * Indicates that a series does not converge. It happens when r >= {@link LIMIT_CYCLE_2}.
 * @see {@link LogisticGenerator#convergenceType}
 */
const CHAOS = "CHAOS";


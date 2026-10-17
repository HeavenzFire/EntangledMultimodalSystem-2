import math
import unittest

from heavenzfire_quantum import StateVector


class StateVectorTests(unittest.TestCase):
    def test_initial_state_is_zero(self):
        state = StateVector(2)
        self.assertEqual(state.probabilities(), [1.0, 0.0, 0.0, 0.0])

    def test_hadamard_creates_equal_probabilities(self):
        state = StateVector(1).h(0)
        self.assertAlmostEqual(state.probabilities()[0], 0.5)
        self.assertAlmostEqual(state.probabilities()[1], 0.5)
        self.assertAlmostEqual(state.expectation_z(0), 0.0, places=12)

    def test_ry_pi_flips_zero_to_one(self):
        state = StateVector(1).ry(0, math.pi)
        self.assertAlmostEqual(state.probabilities()[0], 0.0, places=12)
        self.assertAlmostEqual(state.probabilities()[1], 1.0, places=12)
        self.assertAlmostEqual(state.expectation_z(0), -1.0, places=12)

    def test_hadamard_and_cnot_create_bell_state(self):
        state = StateVector(2).h(0).cnot(0, 1)
        probs = state.probabilities()
        self.assertAlmostEqual(probs[0], 0.5)
        self.assertAlmostEqual(probs[3], 0.5)
        self.assertAlmostEqual(probs[1], 0.0)
        self.assertAlmostEqual(probs[2], 0.0)

    def test_sampling_is_reproducible_and_counts_sum(self):
        state = StateVector(2).h(0).cnot(0, 1)
        first = state.sample(shots=500, seed=123)
        second = state.sample(shots=500, seed=123)
        self.assertEqual(first, second)
        self.assertEqual(sum(first.values()), 500)
        self.assertTrue(set(first).issubset({"00", "11"}))

    def test_rejects_invalid_size_and_gate_arguments(self):
        with self.assertRaises(ValueError):
            StateVector(0)
        with self.assertRaises(ValueError):
            StateVector(11)
        with self.assertRaises(ValueError):
            StateVector(2).cnot(1, 1)
        with self.assertRaises(ValueError):
            StateVector(1).h(1)
        with self.assertRaises(ValueError):
            StateVector(1).ry(0, float("nan"))


if __name__ == "__main__":
    unittest.main()

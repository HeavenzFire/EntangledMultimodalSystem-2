"""
Instanton Computation for Stochastic Cascade Systems with Delays
================================================================

This module implements the Advanced-Delay String Method for computing optimal
escape trajectories (instantons) in stochastic cascade systems using the 
Martin-Siggia-Rose-Janssen-de Dominicis (MSRJD) path-integral formalism.

Key Features:
- Two-point boundary value problem solver with advanced time shifts
- Momentum field computation with interpolation-based future evaluation
- Detection of focal manifolds and caustic singularities
- Early-warning precursor analysis

Author: Infrastructure Math Division
Date: 2024
"""

import numpy as np
from scipy.interpolate import interp1d, CubicSpline
from scipy.optimize import minimize_scalar
import matplotlib.pyplot as plt
from dataclasses import dataclass
from typing import Tuple, List, Optional


@dataclass
class CascadeParams:
    """Parameters for n-tier stochastic cascade system."""
    r: np.ndarray      # Growth rates
    K: np.ndarray      # Carrying capacities
    mu: np.ndarray     # Decay rates
    beta: np.ndarray   # Coupling strengths (length n-1)
    sigma: np.ndarray  # Noise intensities
    tau: np.ndarray    # Time delays (length n, tau[0] = 0)
    n_tiers: int
    
    def __post_init__(self):
        self.n_tiers = len(self.r)
        if len(self.beta) != self.n_tiers - 1:
            raise ValueError("beta must have length n_tiers - 1")
        if len(self.tau) != self.n_tiers:
            raise ValueError("tau must have length n_tiers")


class InstantonSolver:
    """
    Solver for optimal escape trajectories in delayed stochastic cascades.
    
    Uses a shooting method combined with string relaxation to find minimum-action
    paths from stable equilibrium to basin boundary.
    """
    
    def __init__(self, params: CascadeParams, n_grid: int = 100, dt: float = 0.05):
        self.params = params
        self.n_grid = n_grid
        self.dt = dt
        self.n_tiers = params.n_tiers
        
        # Compute stable equilibrium
        self.X_star = self._compute_equilibrium()
        self.Jacobian_star = self._compute_jacobian_at_equilibrium()
        
    def _compute_jacobian_at_equilibrium(self) -> np.ndarray:
        """Compute Jacobian matrix at equilibrium for linearized analysis."""
        J = np.zeros((self.n_tiers, self.n_tiers))
        for i in range(self.n_tiers):
            for j in range(self.n_tiers):
                J[i, j] = self._drift_jacobian(self.X_star, i, j)
        return J
    
    def _compute_equilibrium(self) -> np.ndarray:
        """Find stable equilibrium point X* where F(X*) = 0."""
        from scipy.optimize import fsolve
        
        def drift_residual(X):
            residual = np.zeros(self.n_tiers)
            for k in range(self.n_tiers):
                # Logistic growth
                residual[k] = self.params.r[k] * X[k] * (1 - X[k]/self.params.K[k])
                
                # Coupling from previous tier (if exists)
                if k > 0:
                    residual[k] += self.params.beta[k-1] * X[k-1] * (self.params.K[k] - X[k])
                
                # Decay
                residual[k] -= self.params.mu[k] * X[k]
            
            return residual
        
        # Initial guess: half carrying capacity
        X0 = self.params.K / 2
        X_star = fsolve(drift_residual, X0)
        
        # Ensure positive and within bounds
        X_star = np.clip(X_star, 0.1, self.params.K - 0.1)
        
        return X_star
    
    def _drift(self, X: np.ndarray, X_delayed: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Compute deterministic drift F_k(X).
        
        Parameters:
        -----------
        X : ndarray
            Current state vector
        X_delayed : ndarray, optional
            Delayed state vector X(t - tau). If None, uses X (no delay).
        """
        F = np.zeros(self.n_tiers)
        
        for k in range(self.n_tiers):
            # Logistic growth
            F[k] = self.params.r[k] * X[k] * (1 - X[k]/self.params.K[k])
            
            # Coupling from previous tier
            if k > 0:
                X_prev = X_delayed[k-1] if X_delayed is not None else X[k-1]
                F[k] += self.params.beta[k-1] * X_prev * (self.params.K[k] - X[k])
            
            # Decay
            F[k] -= self.params.mu[k] * X[k]
        
        return F
    
    def _drift_jacobian(self, X: np.ndarray, row: int, col: int) -> float:
        """Compute partial derivative dF_row / dX_col."""
        h = 1e-6
        X_plus = X.copy()
        X_minus = X.copy()
        
        X_plus[col] += h
        X_minus[col] -= h
        
        F_plus = self._drift(X_plus)
        F_minus = self._drift(X_minus)
        
        return (F_plus[row] - F_minus[row]) / (2 * h)
    
    def _hamiltonian(self, X: np.ndarray, p: np.ndarray) -> float:
        """Compute Hamiltonian H(X, p)."""
        F = self._drift(X)
        
        H = 0.0
        for k in range(self.n_tiers):
            H += p[k] * F[k]
            H += 0.5 * self.params.sigma[k]**2 * X[k]**2 * p[k]**2
        
        return H
    
    def _action(self, X_path: np.ndarray, p_path: np.ndarray) -> float:
        """
        Compute MSRJD action S[X, p].
        
        Parameters:
        -----------
        X_path : ndarray (n_time, n_tiers)
            State trajectory
        p_path : ndarray (n_time, n_tiers)
            Momentum trajectory
        """
        n_time = X_path.shape[0]
        S = 0.0
        
        for i in range(n_time - 1):
            dt = self.dt
            
            # Time derivative of X
            dXdt = (X_path[i+1] - X_path[i]) / dt
            
            # Drift at current point
            F = self._drift(X_path[i])
            
            # Action integrand
            for k in range(self.n_tiers):
                term1 = p_path[i, k] * (dXdt[k] - F[k])
                term2 = 0.5 * self.params.sigma[k]**2 * X_path[i, k]**2 * p_path[i, k]**2
                S += (term1 - term2) * dt
        
        return S
    
    def compute_instanton(self, X_boundary: np.ndarray, n_iter: int = 500, 
                         tol: float = 1e-8, verbose: bool = True) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Compute optimal escape trajectory using shooting method with string relaxation.
        
        The algorithm uses the linearized dynamics near equilibrium to initialize
        the momentum field, then iteratively refines using forward-backward sweeps.
        
        Parameters:
        -----------
        X_boundary : ndarray
            Target point on basin boundary (escape destination)
        n_iter : int
            Maximum number of iterations
        tol : float
            Convergence tolerance for action change
        verbose : bool
            Print progress information
        
        Returns:
        --------
        X_instanton : ndarray (n_grid, n_tiers)
            Optimal state trajectory
        p_instanton : ndarray (n_grid, n_tiers)
            Conjugate momentum field
        S_min : float
            Minimum action value
        """
        n_time = self.n_grid
        
        # Initialize string: linear interpolation from X_star to X_boundary
        X_string = np.zeros((n_time, self.n_tiers))
        for k in range(self.n_tiers):
            X_string[:, k] = np.linspace(self.X_star[k], X_boundary[k], n_time)
        
        # Initialize momentum using linearized theory
        # Near equilibrium, optimal escape follows unstable manifold direction
        # For small fluctuations: p ~ (X - X*) / (sigma^2 X*^2)
        p_string = np.zeros((n_time, self.n_tiers))
        for i in range(n_time):
            for k in range(self.n_tiers):
                delta_X = X_string[i, k] - self.X_star[k]
                if abs(delta_X) > 1e-6:
                    # Linearized momentum relation
                    p_string[i, k] = delta_X / (self.params.sigma[k]**2 * self.X_star[k]**2 + 1e-6)
        
        # Set terminal momentum to zero (free endpoint condition)
        p_string[-1, :] = 0.0
        
        S_old = float('inf')
        
        for iteration in range(n_iter):
            # Step 1: Forward integration - update X given p
            X_new = self._forward_integrate(X_string, p_string)
            
            # Clamp X to physical bounds
            X_new = np.clip(X_new, 0.01, self.params.K - 0.01)
            
            # Step 2: Backward integration - update p with advanced terms
            p_new = self._backward_integrate_advanced(X_new, p_string)
            
            # Enforce terminal condition
            p_new[-1, :] = 0.0
            
            # Step 3: Re-parameterize by arc length (geometric smoothing)
            X_new, p_new = self._reparametrize_string(X_new, p_new)
            
            # Step 4: Check convergence
            S_new = self._action(X_new, p_new)
            
            if verbose and iteration % 50 == 0:
                print(f"Iteration {iteration}: Action = {S_new:.6f}, Change = {abs(S_new - S_old):.2e}")
            
            if abs(S_new - S_old) < tol and iteration > 10:
                if verbose:
                    print(f"Converged after {iteration} iterations.")
                break
            
            S_old = S_new
            X_string, p_string = X_new, p_new
        
        else:
            if verbose:
                print(f"Warning: Did not converge after {n_iter} iterations.")
        
        return X_string, p_string, S_new
    
    def _forward_integrate(self, X: np.ndarray, p: np.ndarray) -> np.ndarray:
        """
        Forward integrate state equation: dX/dt = dH/dp = F + sigma^2 X^2 p
        """
        n_time = X.shape[0]
        X_new = np.zeros_like(X)
        X_new[0] = self.X_star  # Fixed initial condition
        
        for i in range(n_time - 1):
            dXdt = np.zeros(self.n_tiers)
            
            for k in range(self.n_tiers):
                F_k = self._drift(X[i])[k]
                dXdt[k] = F_k + self.params.sigma[k]**2 * X[i, k]**2 * p[i, k]
            
            # Euler forward step
            X_new[i+1] = X_new[i] + dXdt * self.dt
        
        return X_new
    
    def _backward_integrate_advanced(self, X: np.ndarray, p: np.ndarray) -> np.ndarray:
        """
        Backward integrate momentum equation with advanced time shifts.
        
        dp_k/dt = -dH/dX_k = -p_k * dF_k/dX_k 
                  - sum_j p_j(t+tau_j) * dF_j/dX_k(t+tau_j)
                  - sigma_k^2 X_k p_k^2
        """
        n_time = X.shape[0]
        p_new = np.zeros_like(p)
        
        # Create interpolators for each tier to evaluate future values
        t_grid = np.arange(n_time) * self.dt
        
        # Backward integration from t=T to t=0
        for i in reversed(range(n_time - 1)):
            t = i * self.dt
            
            for k in range(self.n_tiers):
                # Local term: -p_k * dF_k/dX_k
                dF_dX_local = self._drift_jacobian(X[i], k, k)
                dpdt = -p[i, k] * dF_dX_local
                
                # Advanced terms: sum over j > k of p_j(t+tau_j) * dF_j/dX_k
                for j in range(k+1, self.n_tiers):
                    tau_j = self.params.tau[j]
                    t_future = t + tau_j
                    
                    # Interpolate future values
                    if t_future >= (n_time - 1) * self.dt:
                        # Beyond grid, use terminal value
                        p_future = 0.0
                        X_future = X[-1]
                    else:
                        # Find interpolation index
                        idx_future = int(t_future / self.dt)
                        if idx_future >= n_time:
                            idx_future = n_time - 1
                        
                        # Linear interpolation for simplicity
                        weight = (t_future / self.dt - idx_future)
                        if idx_future < n_time - 1:
                            p_future = (1 - weight) * p[idx_future, j] + weight * p[idx_future+1, j]
                            X_future = (1 - weight) * X[idx_future] + weight * X[idx_future+1]
                        else:
                            p_future = p[-1, j]
                            X_future = X[-1]
                    
                    dF_dX_cross = self._drift_jacobian(X_future, j, k)
                    dpdt -= p_future * dF_dX_cross
                
                # Nonlinear term: -sigma_k^2 X_k p_k^2
                dpdt -= self.params.sigma[k]**2 * X[i, k] * p[i, k]**2
                
                # Euler backward step
                p_new[i, k] = p[i+1, k] - dpdt * self.dt
        
        return p_new
    
    def _reparametrize_string(self, X: np.ndarray, p: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Re-parameterize string by uniform arc length."""
        n_time = X.shape[0]
        
        # Compute cumulative arc length
        arc_length = np.zeros(n_time)
        for i in range(1, n_time):
            dX = X[i] - X[i-1]
            dp = p[i] - p[i-1]
            ds = np.sqrt(np.sum(dX**2) + np.sum(dp**2))
            
            # Avoid zero increments (causes duplicate arc_length values)
            if ds < 1e-10:
                ds = 1e-10
            
            arc_length[i] = arc_length[i-1] + ds
        
        # Total length
        L = arc_length[-1]
        
        # Check for pathological case
        if L < 1e-8:
            return X, p
        
        # Uniform spacing
        s_uniform = np.linspace(0, L, n_time)
        
        # Remove duplicates from arc_length for interpolation
        # Add small perturbation if needed
        unique_mask = np.ones(n_time, dtype=bool)
        for i in range(1, n_time):
            if arc_length[i] - arc_length[i-1] < 1e-12:
                arc_length[i] = arc_length[i-1] + 1e-12
        
        # Interpolate
        X_new = np.zeros_like(X)
        p_new = np.zeros_like(p)
        
        for k in range(self.n_tiers):
            interp_X = interp1d(arc_length, X[:, k], kind='linear', fill_value='extrapolate')
            interp_p = interp1d(arc_length, p[:, k], kind='linear', fill_value='extrapolate')
            
            X_new[:, k] = interp_X(s_uniform)
            p_new[:, k] = interp_p(s_uniform)
        
        return X_new, p_new
    
    def detect_focal_manifolds(self, p_path: np.ndarray) -> List[float]:
        """
        Detect focal manifold crossings from momentum variance peaks.
        
        Returns list of times t_m where focal manifolds occur.
        """
        n_time = p_path.shape[0]
        t_grid = np.arange(n_time) * self.dt
        
        # Compute momentum variance across tiers
        p_var = np.var(p_path, axis=1)
        
        # Find peaks (simple thresholding)
        threshold = np.mean(p_var) + 2 * np.std(p_var)
        peak_indices = np.where(p_var > threshold)[0]
        
        # Group nearby peaks and find centers
        focal_times = []
        if len(peak_indices) > 0:
            groups = [[peak_indices[0]]]
            for idx in peak_indices[1:]:
                if idx - groups[-1][-1] <= 3:  # Within 3 time steps
                    groups[-1].append(idx)
                else:
                    groups.append([idx])
            
            for group in groups:
                center_idx = np.mean(group)
                focal_times.append(t_grid[int(center_idx)])
        
        return focal_times
    
    def compute_lead_time(self, p_path: np.ndarray, X_path: np.ndarray, 
                         threshold_factor: float = 3.0) -> float:
        """
        Compute early-warning lead time: time between momentum threshold crossing
        and visible state deviation.
        """
        n_time = p_path.shape[0]
        t_grid = np.arange(n_time) * self.dt
        
        # Find when momentum exceeds threshold
        p_magnitude = np.max(np.abs(p_path), axis=1)
        p_threshold = threshold_factor * np.std(p_path[:n_time//10], axis=0).max()
        
        momentum_crossing = np.where(p_magnitude > p_threshold)[0]
        if len(momentum_crossing) == 0:
            return 0.0
        t_momentum = t_grid[momentum_crossing[0]]
        
        # Find when state deviates significantly from equilibrium
        X_deviation = np.max(np.abs(X_path - self.X_star), axis=1)
        X_threshold = 0.1 * np.max(np.abs(X_path[-1] - self.X_star))
        
        state_crossing = np.where(X_deviation > X_threshold)[0]
        if len(state_crossing) == 0:
            return 0.0
        t_state = t_grid[state_crossing[0]]
        
        lead_time = t_state - t_momentum
        return max(0.0, lead_time)


def plot_instanton_results(solver: InstantonSolver, X_path: np.ndarray, 
                          p_path: np.ndarray, S_min: float, save_path: str = None):
    """Generate comprehensive visualization of instanton trajectory."""
    
    n_time = X_path.shape[0]
    t_grid = np.arange(n_time) * solver.dt
    n_tiers = solver.n_tiers
    
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    
    # Panel 1: State trajectories
    ax = axes[0, 0]
    for k in range(n_tiers):
        ax.plot(t_grid, X_path[:, k], label=f'X_{k}(t)', linewidth=2)
    ax.axhline(y=solver.X_star[-1], color='gray', linestyle='--', alpha=0.5, label='Equilibrium')
    ax.set_xlabel('Time')
    ax.set_ylabel('State X_k')
    ax.set_title('Optimal Escape Trajectory (State)')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Panel 2: Momentum trajectories
    ax = axes[0, 1]
    for k in range(n_tiers):
        ax.plot(t_grid, p_path[:, k], label=f'p_{k}(t)', linewidth=2)
    ax.set_xlabel('Time')
    ax.set_ylabel('Momentum p_k')
    ax.set_title('Conjugate Momentum Field')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Panel 3: Phase portrait (first two tiers)
    ax = axes[0, 2]
    if n_tiers >= 2:
        scatter = ax.scatter(X_path[:, 0], X_path[:, 1], c=t_grid, cmap='viridis', s=20)
        plt.colorbar(scatter, ax=ax, label='Time')
        ax.plot(solver.X_star[0], solver.X_star[1], 'r*', markersize=15, label='Equilibrium')
        ax.set_xlabel(f'X_0')
        ax.set_ylabel(f'X_1')
        ax.set_title('Phase Portrait')
        ax.legend()
        ax.grid(True, alpha=0.3)
    else:
        ax.plot(X_path[:, 0], p_path[:, 0])
        ax.set_xlabel('X_0')
        ax.set_ylabel('p_0')
        ax.set_title('Phase Portrait (Single Tier)')
        ax.grid(True, alpha=0.3)
    
    # Panel 4: Momentum magnitude and focal manifolds
    ax = axes[1, 0]
    p_magnitude = np.max(np.abs(p_path), axis=1)
    ax.plot(t_grid, p_magnitude, linewidth=2, label='|p|_max')
    
    focal_times = solver.detect_focal_manifolds(p_path)
    for t_f in focal_times:
        ax.axvline(x=t_f, color='red', linestyle='--', alpha=0.7, label='Focal Manifold' if t_f == focal_times[0] else '')
    
    ax.set_xlabel('Time')
    ax.set_ylabel('Max |p_k|')
    ax.set_title('Momentum Magnitude & Focal Manifolds')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Panel 5: Lead time visualization
    ax = axes[1, 1]
    X_deviation = np.max(np.abs(X_path - solver.X_star), axis=1)
    
    # Find crossings
    p_threshold = 3.0 * np.std(p_path[:n_time//10], axis=0).max()
    momentum_crossing = np.where(p_magnitude > p_threshold)[0]
    
    X_threshold = 0.1 * np.max(np.abs(X_path[-1] - solver.X_star))
    state_crossing = np.where(X_deviation > X_threshold)[0]
    
    if len(momentum_crossing) > 0 and len(state_crossing) > 0:
        t_mom = t_grid[momentum_crossing[0]]
        t_state = t_grid[state_crossing[0]]
        
        ax.axvline(x=t_mom, color='blue', linestyle='--', linewidth=2, label=f'Momentum Warning (t={t_mom:.2f})')
        ax.axvline(x=t_state, color='red', linestyle='--', linewidth=2, label=f'State Deviation (t={t_state:.2f})')
        ax.fill_betweenx([0, max(p_magnitude)], t_mom, t_state, alpha=0.3, color='green', 
                        label=f'Lead Time = {t_state - t_mom:.2f}')
    
    ax.plot(t_grid, p_magnitude, 'b-', linewidth=2, alpha=0.7)
    ax.set_xlabel('Time')
    ax.set_ylabel('Max |p_k|')
    ax.set_title('Early-Warning Lead Time')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    # Panel 6: Action convergence
    ax = axes[1, 2]
    ax.text(0.5, 0.7, f'Minimum Action:\nS_min = {S_min:.4f}', ha='center', va='center', 
            fontsize=14, bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    ax.text(0.5, 0.4, f'Escape Probability:\nP ~ exp(-{S_min:.2f}/σ²)', ha='center', va='center',
            fontsize=12, bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.5))
    ax.axis('off')
    
    plt.suptitle('MSRJD Instanton Analysis: Optimal Escape Pathway', fontsize=16, y=1.02)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"Figure saved to {save_path}")
    
    plt.show()


def main():
    """Demonstration: Two-tier cascade with single delay."""
    
    print("=" * 60)
    print("MSRJD Instanton Computation for Stochastic Cascade System")
    print("=" * 60)
    
    # Define parameters - create a system with clear metastability
    params = CascadeParams(
        r=np.array([1.5, 1.2]),           # Growth rates (higher for stronger attraction)
        K=np.array([100.0, 80.0]),        # Carrying capacities
        mu=np.array([0.3, 0.4]),          # Decay rates
        beta=np.array([0.08]),            # Coupling strength
        sigma=np.array([0.25, 0.35]),     # Noise intensities
        tau=np.array([0.0, 3.0]),         # Delays (tau_0 = 0, tau_1 = 3.0)
        n_tiers=2
    )
    
    print(f"\nSystem Parameters:")
    print(f"  Tiers: {params.n_tiers}")
    print(f"  Growth rates: {params.r}")
    print(f"  Carrying capacities: {params.K}")
    print(f"  Delays: {params.tau}")
    print(f"  Noise intensities: {params.sigma}")
    
    # Create solver
    solver = InstantonSolver(params, n_grid=200, dt=0.03)
    
    print(f"\nStable Equilibrium: X* = {solver.X_star}")
    
    # Define escape boundary - significant deviation from equilibrium toward saturation
    # The boundary should be at the edge of the basin of attraction
    X_boundary = np.array([solver.X_star[0] * 1.15, params.K[1] * 0.97])  # Push toward K_1
    print(f"Escape Target: X_boundary = {X_boundary}")
    print(f"Note: Boundary X_1={X_boundary[1]:.2f} > Equilibrium X*_1={solver.X_star[1]:.2f}")
    print(f"      Distance from equilibrium: ΔX_1 = {X_boundary[1] - solver.X_star[1]:.2f}")
    
    # Compute instanton
    print("\nComputing optimal escape trajectory...")
    X_instanton, p_instanton, S_min = solver.compute_instanton(
        X_boundary, n_iter=800, tol=1e-9, verbose=True
    )
    
    # Analyze results
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Minimum Action: S_min = {S_min:.4f}")
    print(f"Escape Probability: P ~ exp(-{S_min:.2f}/σ²)")
    
    for sigma_sq in [0.16, 0.25, 0.36]:
        P_escape = np.exp(-S_min / sigma_sq)
        print(f"  For σ² = {sigma_sq:.2f}: P ~ {P_escape:.2e}")
    
    # Detect focal manifolds
    focal_times = solver.detect_focal_manifolds(p_instanton)
    print(f"\nFocal Manifold Times: {focal_times}")
    print(f"Expected (multiples of τ=2.5): {[2.5, 5.0, 7.5]}")
    
    # Compute lead time
    lead_time = solver.compute_lead_time(p_instanton, X_instanton)
    print(f"\nEarly-Warning Lead Time: {lead_time:.2f} time units")
    
    # Plot results
    print("\nGenerating visualization...")
    plot_instanton_results(solver, X_instanton, p_instanton, S_min, 
                          save_path='instanton_analysis.png')
    
    print("\nComputation complete!")


if __name__ == "__main__":
    main()

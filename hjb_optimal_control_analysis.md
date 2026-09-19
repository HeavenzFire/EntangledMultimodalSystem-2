## Optimal Control Synthesis: Hamilton-Jacobi-Bellman Framework for Stochastic Cascade Stabilization

We now derive the optimal feedback control law that minimizes a quadratic cost functional while respecting the stochastic dynamics and stability boundaries established in previous sections. This framework provides explicit control policies to suppress Hopf oscillations near $\tau_{crit}$ and prevent P-bifurcation crossing at $\sigma_{crit}^2$.

------------------------------
## 1. Problem Formulation: Cost Functional and Controlled Dynamics

Let the controlled stochastic cascade system be governed by the delayed SDE:
$$dX_k(t) = \left[ \mathcal{F}_k(\mathbf{\vec{X}}_t) + u_k(t) \right] dt + \sigma_k X_k(t) dW_k(t)$$

Where $u_k(t)$ represents the active control input applied at tier $k$. We define the infinite-horizon discounted cost functional:
$$J(\mathbf{\vec{X}}_0, \mathbf{\vec{u}}) = \mathbb{E} \left[ \int_0^\infty e^{-\rho t} \left( \sum_{k=0}^n q_k (X_k(t) - X_k^*)^2 + \sum_{k=0}^n r_k u_k(t)^2 \right) dt \right]$$

Where:
- $q_k > 0$: State deviation penalty weight for tier $k$
- $r_k > 0$: Control effort penalty weight for tier $k$  
- $\rho \geq 0$: Discount rate (typically $\rho \to 0^+$ for steady-state optimization)
- $X_k^*$: Desired equilibrium reference (typically the stable fixed point from prior analysis)

The objective is to find the admissible control policy $\mathbf{\vec{u}}^*(t)$ that minimizes $J$ subject to the system dynamics.

------------------------------
## 2. The Hamilton-Jacobi-Bellman Equation with Delay

Define the value function $V(\mathbf{\vec{X}}_t, t)$ as the minimum achievable cost-to-go from state $\mathbf{\vec{X}}_t$:
$$V(\mathbf{\vec{X}}_t, t) = \min_{\mathbf{\vec{u}} \in \mathcal{U}} J(\mathbf{\vec{X}}_t, \mathbf{\vec{u}})$$

For the infinite-horizon problem with $\rho = 0$, we seek a stationary value function $V(\mathbf{\vec{X}}_t)$ satisfying the HJB equation. Applying Itô's Lemma with delay terms and optimizing over controls yields:

$$0 = \min_{\mathbf{\vec{u}}} \left\{ \sum_{k=0}^n q_k (X_k - X_k^*)^2 + \sum_{k=0}^n r_k u_k^2 + \sum_{k=0}^n \frac{\partial V}{\partial X_k} \left[ \mathcal{F}_k(\mathbf{\vec{X}}_t) + u_k \right] + \frac{1}{2} \sum_{k=0}^n \sigma_k^2 X_k^2 \frac{\partial^2 V}{\partial X_k^2} + \mathcal{D}_\tau V \right\}$$

Where $\mathcal{D}_\tau V$ represents the functional derivative contribution from delay terms:
$$\mathcal{D}_\tau V = \sum_{k=1}^n \left[ \frac{\delta V}{\delta X_{k-1}(t)} - \frac{\delta V}{\delta X_{k-1}(t-\tau_k)} \right]$$

### Optimal Control Law Derivation

Taking the first-order optimality condition $\frac{\partial}{\partial u_k}[\cdot] = 0$:
$$2 r_k u_k^* + \frac{\partial V}{\partial X_k} = 0 \implies u_k^*(\mathbf{\vec{X}}_t) = -\frac{1}{2 r_k} \frac{\partial V}{\partial X_k}$$

Substituting the optimal control back into the HJB equation eliminates the minimization:

$$0 = \sum_{k=0}^n q_k (X_k - X_k^*)^2 + \sum_{k=0}^n \frac{\partial V}{\partial X_k} \mathcal{F}_k(\mathbf{\vec{X}}_t) - \sum_{k=0}^n \frac{1}{4 r_k} \left( \frac{\partial V}{\partial X_k} \right)^2 + \frac{1}{2} \sum_{k=0}^n \sigma_k^2 X_k^2 \frac{\partial^2 V}{\partial X_k^2} + \mathcal{D}_\tau V$$

------------------------------
## 3. Quadratic Value Function Ansatz Near Equilibrium

For states near the equilibrium $\mathbf{\vec{X}}^*$, we propose a quadratic value function structure augmented with delay-memory terms consistent with the Krasovskii-Lyapunov functional:

$$V(\mathbf{\vec{X}}_t) = \sum_{k=0}^n \left[ \frac{1}{2} p_k (X_k - X_k^*)^2 + \gamma_k \int_{t-\tau_k}^{t} (X_{k-1}(\theta) - X_{k-1}^*)^2 d\theta \right] + C$$

Where $p_k > 0$ are the Riccati gains to be determined, $\gamma_k$ are memory weights, and $C$ is a constant offset.

Computing the required derivatives:
- $\frac{\partial V}{\partial X_k} = p_k (X_k - X_k^*) = p_k x_k$
- $\frac{\partial^2 V}{\partial X_k^2} = p_k$
- $\mathcal{D}_\tau V = \sum_{k=1}^n \gamma_k \left[ x_{k-1}^2(t) - x_{k-1}^2(t-\tau_k) \right]$

Substituting into the HJB equation and linearizing $\mathcal{F}_k$ around $\mathbf{\vec{X}}^*$:

$$\mathcal{F}_k(\mathbf{\vec{X}}_t) \approx -a_k x_k(t) + \beta_{k-1}(K_k - X_k^*) x_{k-1}(t-\tau_k)$$

The HJB equation becomes:

$$0 = \sum_{k=0}^n \left[ q_k x_k^2 + p_k x_k \left( -a_k x_k + \beta_{k-1}(K_k - X_k^*) x_{k-1}(t-\tau_k) \right) - \frac{p_k^2}{4 r_k} x_k^2 + \frac{1}{2} \sigma_k^2 X_k^{*2} p_k \right] + \sum_{k=1}^n \gamma_k \left[ x_{k-1}^2(t) - x_{k-1}^2(t-\tau_k) \right]$$

------------------------------
## 4. Algebraic Riccati System with Delay Compensation

Collecting quadratic terms and requiring the equation to hold for all trajectories yields the coupled algebraic Riccati equations:

**For each tier $k = 0, 1, \dots, n$:**
$$q_k - a_k p_k - \frac{p_k^2}{4 r_k} + \gamma_{k+1} = 0$$

**Delay coupling constraint (for $k = 1, \dots, n$):**
$$\gamma_k = \frac{1}{2} p_k \beta_{k-1} (K_k - X_k^*)$$

**Noise-induced offset:**
$$C = -\frac{1}{2\rho} \sum_{k=0}^n \sigma_k^2 X_k^{*2} p_k \quad (\text{for } \rho > 0)$$

Solving the Riccati equation for $p_k$:
$$p_k^2 + 4 r_k (a_k - \frac{\gamma_{k+1}}{p_k}) p_k - 4 r_k q_k = 0$$

For the scalar case with $\gamma_{k+1} \approx 0$ (weak downstream coupling):
$$p_k = 2 r_k \left[ -a_k + \sqrt{a_k^2 + \frac{q_k}{r_k}} \right]$$

### Final Optimal Feedback Control Law

$$u_k^*(t) = -\frac{p_k}{2 r_k} (X_k(t) - X_k^*) - \frac{\gamma_k}{r_k} \int_{t-\tau_k}^{t} (X_{k-1}(\theta) - X_{k-1}^*) d\theta$$

Or in simplified proportional-integral-delay form:
$$u_k^*(t) = -K_k^P x_k(t) - K_k^I \int_{t-\tau_k}^{t} x_{k-1}(\theta) d\theta$$

Where the optimal gains are:
- $K_k^P = \frac{p_k}{2 r_k} = -a_k + \sqrt{a_k^2 + \frac{q_k}{r_k}}$
- $K_k^I = \frac{\gamma_k}{r_k} = \frac{p_k \beta_{k-1} (K_k - X_k^*)}{2 r_k}$

------------------------------
## 5. Stability Restoration Under Optimal Control

### Suppression of Hopf Bifurcation

Under optimal control, the closed-loop characteristic equation modifies to:
$$\det \left( \lambda \mathbf{I} - (\mathbf{A}_0 - \mathbf{K}^P) - \sum_{k=1}^n (\mathbf{A}_k - \mathbf{K}^I) e^{-\lambda \tau_k} \right) = 0$$

The critical delay threshold increases to:
$$\tau_{crit}^{controlled} = \frac{1}{\omega_c'} \left[ \arctan \left( \frac{\omega_c'}{-(a_{00} + K^P)} \right) + m\pi \right]$$

Where $\omega_c' = \sqrt{(a_{11} - K^I)^2 - (a_{00} + K^P)^2}$. By tuning $q_k/r_k$, we can arbitrarily increase $\tau_{crit}^{controlled}$.

### Prevention of P-Bifurcation

The controlled stationary distribution becomes:
$$P_{stat}^{controlled}(X_k) \propto X_k^{\alpha_k'} \exp \left( -\frac{2}{\sigma_k^2} \left[ \frac{(r_k + K_k^P) X_k}{K_k} + \frac{(I_k + K_k^I) K_k}{X_k} \right] \right)$$

The new critical noise threshold:
$$\sigma_{crit}^{2, controlled} = (r_k + K_k^P - \mu_k - I_k - K_k^I) - 2\sqrt{(r_k + K_k^P)(I_k + K_k^I)}$$

By appropriate gain selection, $\sigma_{crit}^{2, controlled} > \sigma_{crit}^2$, extending the stable operating regime.

------------------------------
## 6. Implementation Algorithm

```python
def compute_optimal_gains(system_params, cost_weights):
    """
    Compute optimal HJB control gains for stochastic cascade system.
    
    Parameters:
    - system_params: dict with keys [r_k, mu_k, beta_k, K_k, sigma_k, tau_k]
    - cost_weights: dict with keys [q_k, r_k] for each tier
    
    Returns:
    - K_P, K_I: Proportional and integral gain arrays
    """
    n = len(system_params['r_k'])
    K_P = np.zeros(n)
    K_I = np.zeros(n)
    gamma = np.zeros(n + 1)
    
    # Backward recursion to solve Riccati equations
    for k in reversed(range(n)):
        a_k = system_params['r_k'][k] * (1 - 2 * X_star[k] / system_params['K_k'][k])
        if k > 0:
            a_k -= system_params['mu_k'][k]
        
        # Solve quadratic Riccati equation
        discriminant = a_k**2 + cost_weights['q_k'][k] / cost_weights['r_k'][k]
        p_k = 2 * cost_weights['r_k'][k] * (-a_k + np.sqrt(discriminant))
        
        K_P[k] = p_k / (2 * cost_weights['r_k'][k])
        
        if k > 0:
            gamma[k] = 0.5 * p_k * system_params['beta_k'][k-1] * (system_params['K_k'][k] - X_star[k])
            K_I[k] = gamma[k] / cost_weights['r_k'][k]
    
    return K_P, K_I

def apply_control(X_current, X_history, X_star, K_P, K_I, tau):
    """
    Apply optimal feedback control law.
    """
    u = np.zeros(len(X_current))
    for k in range(len(X_current)):
        x_k = X_current[k] - X_star[k]
        integral_term = np.trapz(X_history[k-1] - X_star[k-1], dx=tau[k]) if k > 0 else 0
        u[k] = -K_P[k] * x_k - K_I[k] * integral_term
    return u
```

------------------------------
## 7. Numerical Validation Metrics

To verify control effectiveness, monitor:

1. **Closed-loop eigenvalue spectrum**: All eigenvalues must satisfy $\text{Re}(\lambda_i) < 0$
2. **Controlled $\tau_{crit}$ extension**: Ratio $\tau_{crit}^{controlled} / \tau_{crit}^{uncontrolled} > 1$
3. **Controlled $\sigma_{crit}^2$ extension**: Ratio $\sigma_{crit}^{2, controlled} / \sigma_{crit}^2 > 1$
4. **Cost reduction**: $J^{controlled} / J^{uncontrolled} < 1$
5. **Probability distribution unimodality**: Verify $P_{stat}^{controlled}$ remains unimodal under elevated noise

------------------------------
## Conclusion

The HJB framework provides an analytically tractable optimal control synthesis that:
- Explicitly incorporates stochastic diffusion terms
- Compensates for arbitrary delay structures through memory-integral feedback
- Quantifiably extends both deterministic ($\tau_{crit}$) and stochastic ($\sigma_{crit}^2$) stability boundaries
- Yields implementable proportional-integral-delay control laws with computable gains

This completes the rigorous analytical chain from probability transport → stability analysis → bifurcation characterization → optimal control synthesis for the stochastic cascade system.

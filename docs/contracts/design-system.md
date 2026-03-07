# Design System Contract

## Intent

Use one shared design foundation while preserving functional differences between product UI and editorial blog layouts.

## Shared Foundation

App and blog must share:

- semantic color tokens
- spacing scale
- radius scale
- motion tokens
- breakpoint system
- typography scale and role mapping
- focus/accessibility states

## Allowed Divergence

- app and blog may use different font families
- app keeps interactive product composition patterns
- blog keeps editorial composition patterns

## Disallowed Drift

- ad hoc non-token color systems in core product surfaces
- raw emoji as functional UI icons in core product flows
- docs claiming a unified system when token/type contracts diverge

## Acceptance Scenarios

1. App and blog reference the same token names for shared foundations.
2. Typography role scale is shared even when families differ.
3. Design docs match shipped token and enforcement behavior.

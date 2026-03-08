-- Protect server-managed profile fields from authenticated client writes.
-- Billing, onboarding, relationship, and provider-tracking fields must remain
-- server-authoritative even though the client can still update safe profile prefs.

CREATE OR REPLACE FUNCTION public.prevent_client_profile_escalation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() = OLD.id THEN
    IF
      NEW.email IS DISTINCT FROM OLD.email OR
      NEW.linked_user_id IS DISTINCT FROM OLD.linked_user_id OR
      NEW.role_confirmed_at IS DISTINCT FROM OLD.role_confirmed_at OR
      NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan OR
      NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR
      NEW.subscription_period IS DISTINCT FROM OLD.subscription_period OR
      NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at OR
      NEW.subscription_started_at IS DISTINCT FROM OLD.subscription_started_at OR
      NEW.subscription_source IS DISTINCT FROM OLD.subscription_source OR
      NEW.subscription_granted_by IS DISTINCT FROM OLD.subscription_granted_by OR
      NEW.subscription_granted_at IS DISTINCT FROM OLD.subscription_granted_at OR
      NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id OR
      NEW.revenuecat_customer_id IS DISTINCT FROM OLD.revenuecat_customer_id OR
      NEW.free_tier_chosen_at IS DISTINCT FROM OLD.free_tier_chosen_at OR
      NEW.trial_expires_at IS DISTINCT FROM OLD.trial_expires_at OR
      NEW.promo_expires_at IS DISTINCT FROM OLD.promo_expires_at OR
      NEW.onboarding_status IS DISTINCT FROM OLD.onboarding_status OR
      NEW.onboarding_completion_reason IS DISTINCT FROM OLD.onboarding_completion_reason OR
      NEW.onboarding_flow_key IS DISTINCT FROM OLD.onboarding_flow_key OR
      NEW.onboarding_step_key IS DISTINCT FROM OLD.onboarding_step_key OR
      NEW.onboarding_started_at IS DISTINCT FROM OLD.onboarding_started_at OR
      NEW.onboarding_last_step_at IS DISTINCT FROM OLD.onboarding_last_step_at OR
      NEW.onboarding_plan_intent IS DISTINCT FROM OLD.onboarding_plan_intent OR
      NEW.onboarding_checkout_session_id IS DISTINCT FROM OLD.onboarding_checkout_session_id OR
      NEW.onboarding_checkout_started_at IS DISTINCT FROM OLD.onboarding_checkout_started_at OR
      NEW.onboarding_error_code IS DISTINCT FROM OLD.onboarding_error_code OR
      NEW.onboarding_error_context IS DISTINCT FROM OLD.onboarding_error_context OR
      NEW.onboarding_version IS DISTINCT FROM OLD.onboarding_version OR
      NEW.onboarding_completed_at IS DISTINCT FROM OLD.onboarding_completed_at OR
      NEW.onboarding_progress IS DISTINCT FROM OLD.onboarding_progress OR
      NEW.tutor_xp IS DISTINCT FROM OLD.tutor_xp OR
      NEW.tutor_tier IS DISTINCT FROM OLD.tutor_tier OR
      NEW.last_practice_at IS DISTINCT FROM OLD.last_practice_at OR
      NEW.last_nudge_at IS DISTINCT FROM OLD.last_nudge_at OR
      NEW.active_relationship_session_id IS DISTINCT FROM OLD.active_relationship_session_id
    THEN
      RAISE EXCEPTION USING
        ERRCODE = '42501',
        MESSAGE = 'This profile field is server managed.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_client_profile_updates ON public.profiles;

CREATE TRIGGER guard_client_profile_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_client_profile_escalation();

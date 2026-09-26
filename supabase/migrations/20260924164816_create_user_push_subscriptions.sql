CREATE TABLE public.user_push_subscriptions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id text NOT NULL,
  language text NOT NULL CHECK (language IN ('it', 'en')),
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, subscription_id)
);

ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their push subscriptions"
  ON public.user_push_subscriptions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their push subscriptions"
  ON public.user_push_subscriptions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their push subscriptions"
  ON public.user_push_subscriptions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their push subscriptions"
  ON public.user_push_subscriptions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

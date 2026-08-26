-- Favorites Table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, product_id)
);

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites" 
ON public.favorites FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Price Alerts Table
CREATE TABLE public.price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    target_price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_alerts TO authenticated;
GRANT ALL ON public.price_alerts TO service_role;

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own price alerts" 
ON public.price_alerts FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications" 
ON public.notifications FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Trigger Function for Price Alerts
CREATE OR REPLACE FUNCTION handle_price_drop_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if the price decreased
    IF NEW.price < OLD.price THEN
        -- Insert notifications for active alerts where current price <= target price
        INSERT INTO public.notifications (user_id, type, title, body, product_id)
        SELECT 
            pa.user_id, 
            'price_alert', 
            'Preço Baixou!', 
            'O produto que você está monitorando caiu para R$ ' || NEW.price,
            NEW.product_id
        FROM public.price_alerts pa
        WHERE pa.product_id = NEW.product_id 
          AND pa.is_active = true 
          AND (pa.target_price IS NULL OR NEW.price <= pa.target_price);

        -- Mark triggered alerts
        UPDATE public.price_alerts
        SET triggered_at = now(),
            is_active = false
        WHERE product_id = NEW.product_id 
          AND is_active = true 
          AND (target_price IS NULL OR NEW.price <= target_price);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Connect trigger to price_history (created in Sprint 1)
-- Assuming price_history table exists from previous turn
CREATE TRIGGER on_price_drop
AFTER INSERT ON public.price_history
FOR EACH ROW EXECUTE FUNCTION handle_price_drop_notification();
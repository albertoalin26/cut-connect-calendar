-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create or replace the handle new user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign default client role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample services if they don't exist
INSERT INTO public.services (name, description, price, duration) 
SELECT 'Taglio Capelli', 'Taglio e acconciatura', 25.00, 30
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Taglio Capelli');

INSERT INTO public.services (name, description, price, duration) 
SELECT 'Piega', 'Asciugatura e styling', 20.00, 45
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Piega');

INSERT INTO public.services (name, description, price, duration) 
SELECT 'Colore', 'Colorazione completa', 60.00, 120
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Colore');

INSERT INTO public.services (name, description, price, duration) 
SELECT 'Shampoo e Piega', 'Lavaggio e acconciatura', 15.00, 30
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Shampoo e Piega');

INSERT INTO public.services (name, description, price, duration) 
SELECT 'Trattamento', 'Trattamento rigenerante', 35.00, 60
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Trattamento');
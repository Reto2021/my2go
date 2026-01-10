-- Add INSERT policy for transactions so users can create their own spend transactions
CREATE POLICY "Users can create own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
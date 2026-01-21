-- Enable realtime for transactions table to sync balance across devices
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
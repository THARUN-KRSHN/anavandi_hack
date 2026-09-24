import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncEngine } from '../services/syncEngine';

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((msg) => {
      // Invalidate relevant query keys on real-time broadcast
      if (msg.type === 'COMPLAINT_UPDATED' || msg.type === 'NOTIFICATION_ADDED') {
        queryClient.invalidateQueries({ queryKey: ['complaints'] });
        queryClient.invalidateQueries({ queryKey: ['depot_notifications'] });
        queryClient.invalidateQueries({ queryKey: ['sms_outbox'] });
        queryClient.invalidateQueries({ queryKey: ['depot_metrics'] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
}

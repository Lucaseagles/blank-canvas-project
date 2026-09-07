import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/bridge-videos')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/videos' });
  },
  component: () => null,
});

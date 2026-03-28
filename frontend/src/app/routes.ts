import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { AudioEntry } from './pages/AudioEntry';
import { Chat } from './pages/Chat';
import { Schemes } from './pages/Schemes';
import { SchemeDetail } from './pages/SchemeDetail';
import { Track } from './pages/Track';
import { Profile } from './pages/Profile';
import { AgriFormFill } from './pages/AgriFormFill';
import { AuthCallback } from './pages/AuthCallback';
import { NotFound } from './pages/NotFound';
import { Dashboard } from './pages/admin/Dashboard';
import { Pipeline } from './pages/admin/Pipeline';
import { AdminSchemes } from './pages/admin/AdminSchemes';
import { Sessions } from './pages/admin/Sessions';
import { AdminUsers } from './pages/admin/AdminUsers';
import { ShubhAvatarShowcase } from './pages/ShubhAvatarShowcase';
import { AvatarCalibrator } from './pages/AvatarCalibrator';
import { AdminLayoutGuard } from './components/AdminGuard';

// App routes configuration
export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: AudioEntry },
      { path: 'chat', Component: Chat },
      { path: 'schemes', Component: Schemes },
      { path: 'schemes/:schemeSlug', Component: SchemeDetail },
      { path: 'track', Component: Track },
      { path: 'profile', Component: Profile },
      { path: 'form-fill', Component: AgriFormFill },
      { path: 'auth/callback', Component: AuthCallback },
      { path: 'avatar-showcase', Component: ShubhAvatarShowcase }, // Dev/Demo page
      { path: 'calibrate', Component: AvatarCalibrator }, // Dev: drag eyes/mouth positions
      {
        path: 'admin',
        Component: AdminLayoutGuard,
        children: [
          { index: true, Component: Dashboard },
          { path: 'dashboard', Component: Dashboard },
          { path: 'pipeline', Component: Pipeline },
          { path: 'schemes', Component: AdminSchemes },
          { path: 'sessions', Component: Sessions },
          { path: 'users', Component: AdminUsers },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);
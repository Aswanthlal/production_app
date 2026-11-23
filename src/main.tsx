import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.tsx'


import { Analytics } from "@vercel/analytics/react";
<>
  <App />
  <Analytics />
</>

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://ideal-ox-41.ap-southeast-2.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
)

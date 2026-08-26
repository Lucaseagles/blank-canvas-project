export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Systems Maintenance | AffiliatePro</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { 
        font: 16px/1.5 'Inter', sans-serif; 
        background: oklch(0.08 0.005 240); 
        color: white; 
        display: grid; 
        place-items: center; 
        min-height: 100vh; 
        margin: 0; 
        padding: 2rem; 
        overflow: hidden;
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        opacity: 0.05;
        pointer-events: none;
      }
      .card { 
        max-width: 32rem; 
        text-align: center; 
        padding: 5rem 4rem; 
        background: oklch(0.12 0.005 240 / 0.8);
        border: 1px solid oklch(0.25 0.15 240 / 0.3);
        border-radius: 3rem;
        box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
        backdrop-filter: blur(20px);
        position: relative;
        overflow: hidden;
      }
      .card::after {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, oklch(0.65 0.15 240), transparent);
      }
      h1 { 
        font-size: 3.5rem; 
        margin: 0 0 1rem; 
        font-weight: 900; 
        letter-spacing: -0.07em; 
        text-transform: uppercase; 
        font-style: italic;
        line-height: 0.9;
      }
      p { 
        color: oklch(0.7 0.01 240); 
        margin: 0 0 3rem; 
        font-size: 1.2rem; 
        font-weight: 500;
        letter-spacing: -0.02em;
      }
      button { 
        padding: 1.25rem 2.5rem; 
        border-radius: 1.5rem; 
        font-weight: 900; 
        text-transform: uppercase;
        letter-spacing: -0.05em;
        cursor: pointer; 
        border: none;
        background: oklch(0.65 0.15 240); 
        color: oklch(0.1 0.01 240);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 20px 40px -10px oklch(0.65 0.15 240 / 0.4);
      }
      button:hover { 
        transform: translateY(-4px) scale(1.02); 
        box-shadow: 0 25px 50px -12px oklch(0.65 0.15 240 / 0.6);
      }
      button:active { transform: translateY(0); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Service Interruption</h1>
      <p>Our intelligent discovery engines are temporarily recalibrating. We'll be back online in just a moment.</p>
      <div class="actions">
        <button onclick="location.reload()">Retry Connection</button>
      </div>
    </div>
  </body>
</html>`;
}

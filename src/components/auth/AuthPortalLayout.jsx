/* eslint-disable @next/next/no-img-element */

export default function AuthPortalLayout({ children }) {
  return (
    <div className="auth-body w-full min-h-screen font-sans">
      <div className="split-layout">
        <div className="brand-panel">
          <div className="brand-panel__inner">
            <div className="brand-logo">
              <img
                src="/logo.jpeg"
                alt="Aman Foundation"
                className="w-full h-auto rounded-xl shadow-lg"
              />
            </div>

            <div className="brand-hero">
              <h1 className="brand-headline">
                Measuring Impact,
                <br />
                Driving Change.
              </h1>
              <p className="brand-desc">
                Access your real-time impact data across Education, Livelihood, and
                Disaster Relief programs.
              </p>
            </div>

            <div className="brand-panel__decoration"></div>
          </div>
        </div>

        <div className="form-panel">
          <div className="form-panel__inner">{children}</div>
        </div>
      </div>
    </div>
  );
}

import "./Page.css";

function Imprint() {
  return (
    <div className="page">
      <div className="page-content">
        <h1>Imprint</h1>
        <p>This is the legal notice and imprint page.</p>
        <h2>Contact Information</h2>
        <p>
          MirrorFace Application
          <br />
          Email: contact@mirrorface.example
          <br />
          Website: www.mirrorface.example
        </p>
        <h2>Disclaimer</h2>
        <p>
          The information provided on this application is for general
          informational purposes only. All information is provided in good
          faith.
        </p>
        <h2>Privacy</h2>
        <p>
          Photos uploaded to this application are processed locally in your
          browser and are not stored on any server.
        </p>
      </div>
    </div>
  );
}

export default Imprint;

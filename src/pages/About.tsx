import "./Page.css";

function About() {
  return (
    <div className="page">
      <div className="page-content">
        <h1>About MirrorFace</h1>
        <p>
          MirrorFace is a simple application that allows you to upload and view
          face photos.
        </p>
        <p>
          Built with React, TypeScript, and modern web technologies, this app
          provides a clean and intuitive interface for managing your photos.
        </p>
        <h2>Features</h2>
        <ul>
          <li>Easy photo upload from your device</li>
          <li>Instant photo preview</li>

          <li>Clean and modern user interface</li>
        </ul>
      </div>
    </div>
  );
}

export default About;

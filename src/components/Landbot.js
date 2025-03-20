/* import React, { useEffect } from 'react';

const LandbotChat = () => {
  // Replace with your Landbot chatbot URL from the dashboard
  const landbotUrl = 'https://cdn.landbot.io/landbot-3/landbot-3.0.0.mjs'; // Update YOUR_CHATBOT_ID

  useEffect(() => {
    // Prevent duplicate script injection
    if (window.Landbot) return;

    // Create script element
    const script = document.createElement('script');
    script.src = landbotUrl;
    script.async = true;
    document.body.appendChild(script);

    // Initialize Landbot when script loads
    script.onload = () => {
      console.log('Landbot script loaded');
      // Customize Landbot configuration (optional)
      window.Landbot.init({
        container: '#landbot-container', // Optional: specify a container
        configUrl: 'https://storage.googleapis.com/landbot.online/v3/H-2806540-3RKUG2ZCOXAIE2JP/index.json', // Replace with your config URL if needed
      });
    };

    // Cleanup on unmount
    return () => {
      const landbotContainer = document.querySelector('.LandbotLivechat-container');
      if (landbotContainer) {
        landbotContainer.remove();
      }
      const scriptElement = document.querySelector(`script[src="${landbotUrl}"]`);
      if (scriptElement) {
        scriptElement.remove();
      }
      delete window.Landbot; // Reset Landbot global
    };
  }, []);

  return (
    <div>
      {/* Optional container for Landbot *///}
     // <div id="landbot-container" style={{ height: '600px', width: '100%' }}></div>
   // </div>
 // );
//};






/*
window.addEventListener('mouseover', initLandbot, { once: true });
window.addEventListener('touchstart', initLandbot, { once: true });
var myLandbot;
function initLandbot() {
  if (!myLandbot) {
    var s = document.createElement('script');
    s.type = "module"
    s.async = true;
    s.addEventListener('load', function() {
      var myLandbot = new Landbot.Livechat({
        configUrl: 'https://storage.googleapis.com/landbot.online/v3/H-2806540-3RKUG2ZCOXAIE2JP/index.json',
      });
    });
    s.src = 'https://cdn.landbot.io/landbot-3/landbot-3.0.0.mjs';
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
  }
} */

//export default LandbotChat; */


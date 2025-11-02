const manifestUrl = "/.well-known/agent-card.json";
      document.addEventListener("DOMContentLoaded", () => {
        const pre = document.getElementById("agent-manifest");
        const status = document.getElementById("manifest-status");
        if (!pre || !status) return;
        fetch(manifestUrl)
          .then((res) => {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
          })
          .then((card) => {
            pre.textContent = JSON.stringify(card, null, 2);
            status.textContent = "Loaded";
          })
          .catch((error) => {
            console.error("[agent-kit] failed to load agent card", error);
            pre.textContent = "Unable to load the agent card manifest. Check the console for details.";
            status.textContent = "Unavailable";
          });
      });
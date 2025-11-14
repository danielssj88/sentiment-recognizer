import React from "react";

const LangSelector = ({ lang, changeLang }) => {
  return (
    <div className="lang-selector">
      <button
        className={lang === "en" ? "lang-btn active" : "lang-btn"}
        onClick={() => changeLang("en")}
      >
        EN
      </button>
      <button
        className={lang === "es" ? "lang-btn active" : "lang-btn"}
        onClick={() => changeLang("es")}
      >
        ES
      </button>
    </div>
  );
};

export default LangSelector;

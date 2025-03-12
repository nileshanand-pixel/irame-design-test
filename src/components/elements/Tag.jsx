import PropTypes from "prop-types";
import React from "react";

const Tag = ({ icon, text, textClassName, className }) => {
  return (
    <div className={`flex items-center shadow-md px-2 py-1 gap-2 rounded-full bg-[#26064A] ${className}`}>
      {icon && (
        <span className="material-symbols-outlined text-white">
          {icon}
        </span>
      )}
      <span className={`text-white ${textClassName}`}>{text}</span>
    </div>
  );
};

Tag.propTypes = {
  icon: PropTypes.string,
  text: PropTypes.string.isRequired,
};

export default Tag;
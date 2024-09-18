import PropTypes from "prop-types";
import React from "react";

const Tag = ({ icon, text }) => {
  return (
    <div className="flex items-center shadow-md px-2 py-2 gap-2 rounded-full bg-[#26064A]">
      {icon && (
        <span className="material-symbols-outlined text-white">
          {icon}
        </span>
      )}
      <span className="text-white">{text}</span>
    </div>
  );
};

Tag.propTypes = {
  icon: PropTypes.string,
  text: PropTypes.string.isRequired,
};

export default Tag;
import React, { useEffect, useState } from 'react';

const Typewriter = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if(displayText && text && displayText.charAt(0) !== text.charAt(0)){
      setDisplayText('');
      setIndex(0);
    }
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 70);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <span>{displayText}</span>
    </div>
  );
};

export default Typewriter;

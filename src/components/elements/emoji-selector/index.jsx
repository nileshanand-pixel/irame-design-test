import EmojiPicker from 'emoji-picker-react';
import { useEffect, useRef, useState } from 'react';


export default function EmojiSelector({
    trigger,
    onSelect,
}) {
    const emojiPickerRef = useRef();
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    useEffect(() => {
        const handleMouseDown = (e) => {
            if(emojiPickerRef && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setIsEmojiPickerOpen(false);
            }
        }

        document.addEventListener("mousedown", handleMouseDown);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
        }
    }, []);

    return (
        <div className="relative">
            <div onClick={() => setIsEmojiPickerOpen(prev => !prev)}>
                {trigger}
            </div>

            {
                isEmojiPickerOpen && 
                <div 
                    className="absolute top-0 left-0 translate-y-[-102%] z-50"
                    ref={emojiPickerRef}
                >
                    <EmojiPicker 
                        width={300}
                        height={400}
                        previewConfig={{
                            showPreview: false,
                        }}
                        skinTonesDisabled
                        onEmojiClick={onSelect}
                    />
                </div>
            }
        </div>
    )
}
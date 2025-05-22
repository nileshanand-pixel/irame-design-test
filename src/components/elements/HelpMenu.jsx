'use client';

import { useState, useRef, useEffect } from 'react';
import { Compass, Book, Flag, Keyboard, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HelpMenu() {
	const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

	const toggleMenu = (e) => {
		// Prevent the click event from propagating to the document
		if (e) {
			e.stopPropagation();
		}
		setIsOpen(!isOpen);
	};

	const menuRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			const buttonElement = document.querySelector(
				'button[aria-label="Help menu"]',
			);
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target) &&
				event.target !== buttonElement &&
				!buttonElement.contains(event.target) &&
				isOpen
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div className="fixed  bottom-6 right-6 z-50">
			{isOpen && (
				<div
					ref={menuRef}
					className="absolute bottom-8 right-0 w-56 bg-white rounded-2xl shadow-lg p-4 mb-4 border border-gray-100"
				>
					<div className="space-y-4">
							<MenuItem
								icon={<Compass className="w-5 h-5" />}
								text="Get Started"
                                onClick={() => {
                                    window.open('https://irame.ai', '_blank')
                                    toggleMenu();
                                }}
							/>
							{/* <MenuItem
								icon={<Book className="w-5 h-5" />}
								text="Help Center"
                                disabled
							/> */}

						{/* <MenuItem
							icon={<Flag className="w-5 h-5" />}
							text="Changelog"
						/> */}
						{/* <MenuItem
							icon={<Keyboard className="w-5 h-5" />}
							text="Keyboard Shortcuts"
						/> */}

						<div className="">
							<FooterLink link="https://www.irame.ai/terms-of-use" text="Terms of Use" />
							<FooterLink link="https://www.irame.ai/privacy-policy" text="Privacy Policy" />
						</div>
					</div>
				</div>
			)}

			<button
				onClick={(e) => toggleMenu(e)}
				className="rounded-full bg-slate-200 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
				aria-label="Help menu"
			>
				<HelpCircle className="w-6 h-6 m-2 text-primary80" />
			</button>
		</div>
	);
}

function MenuItem({ icon, text, onClick, disabled = false }) {
	return (
		<button
			className={`flex text-primary80 truncate items-center gap-4 w-full text-left transition-opacity ${
				disabled ? 'opacity-90 cursor-text' : 'hover:opacity-80'
			}`}
			disabled={disabled}
            onClick={onClick}
		>
			<div>{icon}</div>
			<span className="text-base">{text}</span>
		</button>
	);
}

function FooterLink({ text, link }) {
    return (
        <button 
            onClick={() => window.open(link, '_blank')}
            className="block w-full text-left text-primary60 text-sm py-1 hover:underline"
        >
            {text}
        </button>
    );
}

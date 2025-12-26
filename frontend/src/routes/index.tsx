import { useState, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { MousePointer2, Settings2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const Route = createFileRoute('/')({
	component: App,
});

type MovePayload = { dx: number; dy: number };

function App() {
	const [sensitivity, setSensitivity] = useState(1.5);
	const [feedback, setFeedback] = useState<'idle' | 'move' | 'click'>('idle');

	const lastPos = useRef<{ x: number; y: number } | null>(null);
	const accumulatedDelta = useRef({ x: 0, y: 0 });
	const lastSentTime = useRef(0);

	const touchStartTime = useRef(0);
	const hasMovedSignificantly = useRef(false);
	const maxTouchDistance = useRef(0);

	const moveMouse = useMutation({
		mutationFn: async (payload: MovePayload) => {
			await fetch(`${API_BASE_URL}/mouse/move`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
		},
	});

	const clickMouse = useMutation({
		mutationFn: async (type: 'left' | 'right') => {
			await fetch(`${API_BASE_URL}/mouse/click`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ button: type }),
			});
		},
		onSuccess: () => {
			if (navigator.vibrate) navigator.vibrate(30); 
			setFeedback('click');
			setTimeout(() => setFeedback('idle'), 200);
		},
	});

	const processMovement = () => {
		const now = Date.now();
		if (
			now - lastSentTime.current > 15 &&
			(accumulatedDelta.current.x !== 0 ||
				accumulatedDelta.current.y !== 0)
		) {
			moveMouse.mutate({
				dx: Math.round(accumulatedDelta.current.x),
				dy: Math.round(accumulatedDelta.current.y),
			});
			accumulatedDelta.current = { x: 0, y: 0 };
			lastSentTime.current = now;
		}
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		lastPos.current = { x: touch.clientX, y: touch.clientY };

		touchStartTime.current = Date.now();
		hasMovedSignificantly.current = false;
		maxTouchDistance.current = 0;

		setFeedback('move');
	};

	const handleTouchMove = (e: React.TouchEvent) => {

		if (!lastPos.current) return;
		const touch = e.touches[0];

		const rawDx = touch.clientX - lastPos.current.x;
		const rawDy = touch.clientY - lastPos.current.y;

		maxTouchDistance.current += Math.abs(rawDx) + Math.abs(rawDy);
		if (maxTouchDistance.current > 10) {
			hasMovedSignificantly.current = true;
		}

		const dx = rawDx * sensitivity;
		const dy = rawDy * sensitivity;

		accumulatedDelta.current.x += dx;
		accumulatedDelta.current.y += dy;

		lastPos.current = { x: touch.clientX, y: touch.clientY };
		processMovement();
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		lastPos.current = null;
		processMovement();
		setFeedback('idle');

		const touchDuration = Date.now() - touchStartTime.current;

		if (touchDuration < 200 && !hasMovedSignificantly.current) {
			if (e.changedTouches.length === 1) {
				clickMouse.mutate('left');
			}
		}

		hasMovedSignificantly.current = false;
	};

	return (
		<div className="fixed inset-0 bg-zinc-950 text-white flex flex-col select-none touch-none overscroll-none">
			<div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-4 z-10">
				<div className="flex items-center gap-2 text-emerald-500">
					<MousePointer2 size={20} />
					<span className="font-bold tracking-tight">WebMouse</span>
				</div>

				<div className="flex-1 max-w-50">
					<span className="text-zinc-500 text-sm text-center">
						Sensibilidade
					</span>
					<div className="flex items-center gap-2 mt-2">
						<Settings2 size={14} className="text-zinc-500" />
						<input
							type="range"
							min="0.5"
							max="5.0"
							step="0.1"
							value={sensitivity}
							onChange={(e) =>
								setSensitivity(parseFloat(e.target.value))
							}
							className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
						/>
					</div>
				</div>
			</div>

			<div
				className={`flex-1 relative transition-colors duration-100 ${
					feedback === 'click' ? 'bg-zinc-800' : 'bg-zinc-900'
				}`}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				onContextMenu={(e) => {
					e.preventDefault();
					clickMouse.mutate('right');
				}}
			>
				<div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none">
					<div className="w-64 h-64 border border-zinc-700 rounded-full flex items-center justify-center">
						<div className="w-1 h-1 bg-white rounded-full" />
					</div>
				</div>

				<div className="absolute bottom-6 w-full text-center space-y-1 pointer-events-none opacity-40">
					<p className="text-sm text-zinc-400">
						Toque rápido = Clique Esquerdo
					</p>
				</div>
			</div>

			<div className="h-20 grid grid-cols-2 bg-zinc-950 border-t border-zinc-800">
				<button
					onTouchStart={() => clickMouse.mutate('left')}
					className="border-r border-zinc-800 active:bg-zinc-800 text-zinc-500 font-medium tracking-widest text-xs uppercase"
				>
					Esq
				</button>
				<button
					onTouchStart={() => clickMouse.mutate('right')}
					className="active:bg-zinc-800 text-zinc-500 font-medium tracking-widest text-xs uppercase"
				>
					Dir
				</button>
			</div>
		</div>
	);
}

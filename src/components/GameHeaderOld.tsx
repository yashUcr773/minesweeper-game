"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { ErrorModal } from "./ErrorModal";
import { GameState, Difficulty, DIFFICULTY_CONFIGS, CustomGameConfig } from "../types/game";
import { cn } from "../lib/utils";
import { RotateCcw, BarChart3, Settings, ChevronUp, ChevronDown } from "lucide-react";

interface GameHeaderProps {
	gameState: GameState;
	difficulty: Difficulty;
	onRestart: () => void;
	onDifficultyChange: (difficulty: Difficulty) => void;
	onCustomGame?: (config: CustomGameConfig) => void;
	onShowStats: () => void;
	onShowSettings: () => void;
	timeElapsed: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
	gameState,
	difficulty,
	onRestart,
	onDifficultyChange,
	onCustomGame,
	onShowStats,
	onShowSettings,
	timeElapsed,
}) => {
	const { config, stats, status } = gameState;
	const minesRemaining = config.mines - stats.flagsUsed;

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const getStatusEmoji = () => {
		switch (status) {
			case "won":
				return "😎";
			case "lost":
				return "😵";
			case "playing":
				return "😮";
			default:
				return "🙂";
		}
	};
	const getStatusMessage = () => {
		switch (status) {
			case "won":
				return "Congratulations! You won!";
			case "lost":
				return "Game Over! Try again!";
			case "playing":
				return "Game in progress...";
			default:
				return "Click a cell to start!";
		}
	}; // Custom game state
	const [showCustomGame, setShowCustomGame] = useState(false);
	const [customConfig, setCustomConfig] = useState({
		width: 16,
		height: 16,
		mines: 40,
	});
	const [showError, setShowError] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isCollapsed, setIsCollapsed] = useState(false);

	const validateCustomConfig = (config: CustomGameConfig): string | null => {
		if (config.width < 5 || config.width > 99) return "Width must be between 5 and 99";
		if (config.height < 5 || config.height > 99) return "Height must be between 5 and 99";
		if (config.mines < 1) return "Must have at least 1 mine";

		const maxMines = Math.floor(config.width * config.height * 0.8);
		if (config.mines >= config.width * config.height) return "Mines cannot fill all cells";
		if (config.mines > maxMines) return `Too many mines (max: ${maxMines})`;

		return null;
	};
	const handleCustomGameSubmit = () => {
		const error = validateCustomConfig(customConfig);
		if (error) {
			setErrorMessage(error);
			setShowError(true);
			return;
		}

		if (onCustomGame) {
			onCustomGame(customConfig);
			setShowCustomGame(false);
		}
	};
	return (
		<div className="bg-white rounded-lg shadow-lg mb-4">
			{/* Always Visible: Compact Game Controls */}
			<div className="p-4 flex items-center justify-between">
				{/* Essential Game Info */}
				<div className="flex items-center space-x-4">
					{/* Mine Counter */}
					<div className="bg-black text-green-400 font-mono text-lg px-3 py-2 rounded border-2 border-gray-400 min-w-[70px] text-center">
						{minesRemaining.toString().padStart(3, "0")}
					</div>

					{/* Timer */}
					<div className="bg-black text-green-400 font-mono text-lg px-3 py-2 rounded border-2 border-gray-400 min-w-[70px] text-center">
						{formatTime(timeElapsed)}
					</div>
				</div>

				{/* Center: Restart Button with Status */}
				<div className="flex flex-col items-center space-y-1">
					<Button
						onClick={onRestart}
						variant="outline"
						size="lg"
						className="w-14 h-14 text-2xl p-0 border-2 hover:scale-105 transition-transform">
						{getStatusEmoji()}
					</Button>
					<p className="text-xs text-gray-600 font-medium text-center">{getStatusMessage()}</p>
				</div>

				{/* Right: Quick Actions & Collapse Toggle */}
				<div className="flex items-center space-x-2">
					<Button onClick={onShowStats} variant="outline" size="sm" className="flex items-center space-x-1">
						<BarChart3 className="w-4 h-4" />
						<span className="hidden sm:inline">Stats</span>
					</Button>
					<Button
						onClick={onShowSettings}
						variant="outline"
						size="sm"
						className="flex items-center space-x-1">
						<Settings className="w-4 h-4" />
						<span className="hidden sm:inline">Settings</span>
					</Button>
					<Button
						onClick={() => setIsCollapsed(!isCollapsed)}
						variant="ghost"
						size="sm"
						className="ml-2"
						title={isCollapsed ? "Expand controls" : "Collapse controls"}>
						{isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
					</Button>
				</div>
			</div>

			{/* Collapsible Content */}
			{!isCollapsed && (
				<div className="border-t px-4 pb-4">
					{/* Difficulty Selection */}
					<div className="pt-4">
						<div className="flex flex-col space-y-4">
							<div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
								<h3 className="text-lg font-semibold text-gray-800">Difficulty Level:</h3>

								<div className="flex space-x-2">
									<Button
										onClick={onRestart}
										variant="outline"
										className="flex items-center space-x-2">
										<RotateCcw className="w-4 h-4" />
										<span>New Game</span>
									</Button>
								</div>
							</div>

							<div className="flex flex-wrap gap-2 justify-center">
								{Object.entries(DIFFICULTY_CONFIGS).map(([diff, config]) => {
									if (diff === "custom") return null;

									return (
										<Button
											key={diff}
											onClick={() => onDifficultyChange(diff as Difficulty)}
											variant={difficulty === diff ? "default" : "outline"}
											className={cn(
												"transition-all duration-200",
												difficulty === diff && "ring-2 ring-blue-500"
											)}>
											<div className="text-center">
												<div className="font-semibold capitalize">{diff}</div>
												<div className="text-xs opacity-75">
													{config.width}×{config.height}, {config.mines} mines
												</div>
											</div>
										</Button>
									);
								})}

								<Button
									onClick={() => setShowCustomGame(!showCustomGame)}
									variant={showCustomGame ? "default" : "outline"}
									className={cn(
										"transition-all duration-200",
										showCustomGame && "ring-2 ring-purple-500"
									)}>
									<div className="text-center">
										<div className="font-semibold">Custom</div>
										<div className="text-xs opacity-75">Create your own</div>
									</div>
								</Button>
							</div>

							{/* Custom Game Configuration */}
							{showCustomGame && (
								<div className="bg-gray-50 p-4 rounded-lg border">
									<h4 className="text-md font-semibold text-gray-800 mb-3">
										Custom Game Configuration
									</h4>{" "}
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
										{" "}
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Width (5-99)
											</label>
											<input
												type="number"
												value={customConfig.width === 0 ? "" : customConfig.width}
												onChange={(e) =>
													setCustomConfig((prev) => ({
														...prev,
														width:
															e.target.value === "" ? 0 : parseInt(e.target.value) || 0,
													}))
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Height (5-99)
											</label>
											<input
												type="number"
												value={customConfig.height === 0 ? "" : customConfig.height}
												onChange={(e) =>
													setCustomConfig((prev) => ({
														...prev,
														height:
															e.target.value === "" ? 0 : parseInt(e.target.value) || 0,
													}))
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Mines (1-{Math.floor(customConfig.width * customConfig.height * 0.8)})
											</label>
											<input
												type="number"
												value={customConfig.mines === 0 ? "" : customConfig.mines}
												onChange={(e) =>
													setCustomConfig((prev) => ({
														...prev,
														mines:
															e.target.value === "" ? 0 : parseInt(e.target.value) || 0,
													}))
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</div>
									<div className="flex justify-between items-center mt-4">
										<div className="text-sm text-gray-600">
											Board: {customConfig.width}×{customConfig.height} ={" "}
											{customConfig.width * customConfig.height} cells, Density:{" "}
											{Math.round(
												(customConfig.mines / (customConfig.width * customConfig.height)) * 100
											)}
											%
										</div>
										<div className="flex space-x-2">
											<Button
												onClick={() => setShowCustomGame(false)}
												variant="outline"
												size="sm">
												Cancel
											</Button>
											<Button onClick={handleCustomGameSubmit} size="sm">
												Start Custom Game
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Game Statistics */}
					<div className="border-t pt-4 mt-4">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
							<div className="bg-gray-50 p-3 rounded">
								<div className="text-sm text-gray-600">Cells Revealed</div>
								<div className="text-lg font-bold text-blue-600">{stats.cellsRevealed}</div>
							</div>
							<div className="bg-gray-50 p-3 rounded">
								<div className="text-sm text-gray-600">Flags Used</div>
								<div className="text-lg font-bold text-orange-600">{stats.flagsUsed}</div>
							</div>
							<div className="bg-gray-50 p-3 rounded">
								<div className="text-sm text-gray-600">Completion</div>
								<div className="text-lg font-bold text-green-600">
									{Math.round(
										(stats.cellsRevealed / (config.width * config.height - config.mines)) * 100
									) || 0}
									%
								</div>{" "}
							</div>
						</div>
					</div>

					{/* Error Modal */}
					<ErrorModal
						isOpen={showError}
						onClose={() => setShowError(false)}
						title="Invalid Custom Game Configuration"
						message={errorMessage}
					/>
				</div>
			)}
		</div>
	);
};

import { writable } from "svelte/store";
import Game from "./game";

export const currentStep = writable(0);

export const game = writable(new Game());

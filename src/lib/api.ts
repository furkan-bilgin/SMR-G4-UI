import axios from 'axios';
import { dev } from '$app/environment';

const baseURL = dev ? 'http://localhost:8000/' : 'https://neutrino.erciyes.edu.tr/SMR-G4/api/';

const api = axios.create({
	baseURL: baseURL,
	headers: {
		'Content-Type': 'application/json'
	}
});

export default api;

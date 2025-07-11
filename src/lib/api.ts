import axios from 'axios';
import { dev } from '$app/environment';

const baseURL = dev ? 'http://localhost:8000/' : '';

const api = axios.create({
	baseURL: baseURL,
	headers: {
		'Content-Type': 'application/json'
	}
});

export default api;

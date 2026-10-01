import axios from "axios";

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("hirelens_token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem("hirelens_token");
			localStorage.removeItem("hirelens_user");
		}
		return Promise.reject(error);
	},
);

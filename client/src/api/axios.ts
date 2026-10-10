import axios from "axios";

const getCsrfToken = () => {
	const cookieValue = document.cookie
		.split(";")
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith("hirelens_csrf="));

	if (!cookieValue) {
		return "";
	}

	return decodeURIComponent(cookieValue.split("=")[1] ?? "");
};

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
	withCredentials: true,
});

api.interceptors.request.use((config) => {
	if (config.method && ["get", "head", "options"].includes(config.method.toLowerCase())) {
		return config;
	}

	const csrfToken = getCsrfToken();
	if (csrfToken) {
		config.headers["X-CSRF-Token"] = csrfToken;
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => Promise.reject(error),
);

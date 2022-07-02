import { useEffect, useState } from "preact/hooks";

const useWindowWidth = (): number => {
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const setter = () => {
		setWindowWidth(window.innerWidth);
	};

	useEffect(() => {
		window.addEventListener("resize", setter);

		return () => window.removeEventListener("resize", setter);
	}, []);

	return windowWidth;
};

export default useWindowWidth;

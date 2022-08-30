const getCookie = (cname) => {
	let name = cname + "=";

	let decodedCookie = decodeURIComponent(document.cookie);

	let ca = decodedCookie.split(";");

	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];

		while (c.charAt(0) == " ") {
			c = c.substring(1);
		}

		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}

	return "";
};

const tokens = JSON.parse(getCookie("tokens").replace("j:", ""));

if ("__TAURI__" in window) {
	window.__TAURI__.tauri.invoke("oauth_login_token", tokens);
} else if ("opener" in window && "postMessage" in window.opener) {
	window.opener.postMessage(JSON.stringify(tokens), "*");

	document.getElementById("text").innerHTML =
		"Login complete, you can now close this window.";
} else {
	document.getElementById("text").innerHTML =
		"Thats weird, your browser does not support communication between browser windows. Please upgrade your browser or use another one.";
}

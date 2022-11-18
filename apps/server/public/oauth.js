const accessToken = JSON.parse(`{{access_token}}`);
const refreshToken = JSON.parse(`{{refresh_token}}`);
const username = "{{username}}";

document.getElementById("text").innerHTML = "Logging in, please wait...";

if ("{{isTauri}}") {
	document.getElementById("text").innerHTML =
		"OAuth login using the desktop application is currently not yet supported";

	// const payload = btoa(JSON.stringify([accessToken, refreshToken, username]));

	// const textarea = document.createElement("textarea");

	// textarea.value = payload;

	// textarea.rows = 1;

	// document.body.appendChild(textarea);
} else if ("opener" in window && "postMessage" in window.opener) {
	window.opener.postMessage(
		JSON.stringify({ tokens: [accessToken, refreshToken], username }),
		"{{clientHostname}}"
	);

	document.getElementById("text").innerHTML =
		"Login complete, you can now close this window.";
} else {
	document.getElementById("text").innerHTML =
		"Thats weird, your browser does not support communication between browser windows. Please upgrade your browser or use another one.";
}

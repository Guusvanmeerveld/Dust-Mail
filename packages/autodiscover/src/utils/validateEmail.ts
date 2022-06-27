import { emailRegex } from "../constants";

const validateEmail = (email: string): boolean => !!email.match(emailRegex);

export default validateEmail;

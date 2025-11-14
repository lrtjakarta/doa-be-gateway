const serviceUrl = process.env.SERVICE_URI || "http://localhost";

const authServices = `${serviceUrl}:1001`;
const userServices = `${serviceUrl}:1001`;
// const medicalServices = `${serviceUrl}:1002`
// const contentServices = `${serviceUrl}:1003`

module.exports = {
  authServices,
  userServices,
  // medicalServices,
  // contentServices
};

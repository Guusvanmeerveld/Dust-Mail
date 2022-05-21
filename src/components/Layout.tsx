import Navbar from "@components/Navbar";

const Layout = ({ children }: { children: JSX.Element | JSX.Element[] }) => (
  <>
    <Navbar />
    {children}
  </>
);

export default Layout;

import { createRoot } from "react-dom/client";

function App() {
    const becomeMember = () => {

    };
    const becomeNode = () => {

    };
    const alreadyAMember = () => {

    };

    return <div>
        <button onClick={becomeMember}>Become a member</button>
        <button onClick={becomeNode}>Become a node</button>
        <button onClick={alreadyAMember}>Already a member</button>
    </div>;
}

const appContainer = document.getElementById("app");
createRoot(appContainer).render(<App />);
import { createRoot } from "react-dom/client";

function App() {
    const becomeMember = () => {

    };
    const becomeNode = () => {

    };
    const alreadyAMember = () => {

    };

    return <section className="hero is-primary is-fullheight">
        <div className="hero-body">
            <div class="" style={{ width: '100%' }}>
                <p className="title">NikolausDAO</p>
                <p className="subtitle">Choose one of the options below!</p>
                <div className="is-flex is-flex-direction-row is-justify-content-space-evenly">
                    <button onClick={becomeMember} className="button is-info is-large">Become a member</button>
                    <button onClick={becomeNode} className="button is-info is-large">Become a node</button>
                    <button onClick={alreadyAMember} className="button is-info is-large">Already a member</button>
                </div>
            </div>
        </div>
    </section >;
}

const appContainer = document.getElementById("app");
createRoot(appContainer).render(<App />);

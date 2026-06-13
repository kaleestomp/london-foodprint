import { useRive } from '@rive-app/react-canvas';
import './RiveAvatarTest.css';

const RiveAvatarTest: React.FC = () => {
  const { RiveComponent } = useRive({
    src: 'https://cdn.rive.app/animations/vehicles.riv',
    stateMachines: 'bumpy',
    autoplay: true,
  });

  return (
    <section className="rive-avatar-test-card" aria-label="Rive avatar test">
      <div className="rive-avatar-test-copy">
        <p className="rive-avatar-test-kicker">Rive test</p>
        <h2>Sample avatar animation</h2>
        <p>
          Temporary runtime check using a public Rive file. If this renders,
          the Rive frontend pipeline is working.
        </p>
      </div>

      <div className="rive-avatar-test-stage">
        <RiveComponent className="rive-avatar-test-canvas" />
      </div>
    </section>
  );
};

export default RiveAvatarTest;
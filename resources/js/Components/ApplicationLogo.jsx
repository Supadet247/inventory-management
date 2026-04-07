export default function ApplicationLogo(props) {
    return (
        <img
            {...props}
            src="/images/logo.png"
            alt="สมบัติเกษตรยนต์ Logo"
            className={`object-contain ${props.className || ''}`}
        />
    );
}
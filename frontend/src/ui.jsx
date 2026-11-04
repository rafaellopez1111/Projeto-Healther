import { useState } from 'react';

export function Field({ id, label, ...rest }) {
  return (
    <div className="fld">
      <label className="lbl" htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </div>
  );
}

export function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="fld">
      <label className="lbl" htmlFor={id}>{label}</label>
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} />
      <button type="button" className="sh" onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Mostrar'}</button>
    </div>
  );
}

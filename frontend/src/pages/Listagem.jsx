import { useEffect, useState } from "react";
import styles from '../App.module.css';

function Listagem({ onAddUser }) {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8800/api/usuarios")
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.error("Erro ao buscar usuários:", err));
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Lista de Usuários</h2>
      <button className={styles.button} onClick={onAddUser}>Adicionar Usuário</button>

      <div className={styles.lista}>
        {usuarios.map((user) => (
          <div key={user.id} className={styles.card}>
            <img 
              src={`http://localhost:8800${user.imagem}`} 
              alt={user.nome} 
              className={styles.cardImage}
            />
            <p className={styles.cardText}>{user.nome}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Listagem;
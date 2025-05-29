import { useState } from "react";
import styles from '../App.module.css';

function Cadastro({ onCancel, onSuccess }) {
  const [nome, setNome] = useState("");
  const [imagem, setImagem] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("imagem", imagem);

    try {
      await fetch("http://localhost:8800/api/add", {
        method: "POST",
        body: formData,
      });
      alert("Usuário cadastrado!");
      onSuccess();
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao cadastrar.");
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Cadastro de Usuário</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className={styles.input}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImagem(e.target.files[0])}
          required
          className={styles.fileInput}
        />
        <button type="submit" className={`${styles.button} ${styles.submitButton}`}>
          Salvar
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          className={`${styles.button} ${styles.cancelButton}`}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default Cadastro;
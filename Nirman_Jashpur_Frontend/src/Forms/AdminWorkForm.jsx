import React, { useState } from 'react';

const AdminWorkForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: handle form submission logic
        console.log(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Title:</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label>Description:</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label>Status:</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <button type="submit">Submit</button>
        </form>
    );
};

export default AdminWorkForm;
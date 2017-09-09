import React from 'react';
import { Modal, ProgressBar } from 'react-bootstrap';

const Loading = ({ }) => (
    <div className="please-wait modal-open">
        <Modal.Dialog>
            <Modal.Header>
                <Modal.Title>Please wait...</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <ProgressBar active now={100} />
            </Modal.Body>
        </Modal.Dialog>
    </div>
);

export default Loading;

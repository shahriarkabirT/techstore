import mongoose, { Schema, Model } from 'mongoose';

export interface ICounter {
    _id: string;
    seq: number;
}

const counterSchema = new Schema<ICounter>({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter: Model<ICounter> = mongoose.models.Counter || mongoose.model<ICounter>('Counter', counterSchema);

export async function getNextSequence(name: string): Promise<number> {
    const counter = await Counter.findByIdAndUpdate(
        name,
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true }
    );
    // User requested order to start from 000100. If it's the first time and we want 100, we should ensure the sequence starts at 100.
    if (name === 'orderId' && counter.seq < 100) {
        counter.seq = 100;
        await counter.save();
    }
    return counter.seq;
}

export default Counter;

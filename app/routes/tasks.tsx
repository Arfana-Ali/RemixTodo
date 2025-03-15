import { SparklesCore } from "../../components/ui/sparkles"
import { LoaderFunction, ActionFunction, json } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import prisma from "~/utils/db";

// Response type  (for TypeScript)
type TaskResponse = {
  error?: string;
  message?: string;
  id?: string;
  category?: string;
};

export const loader: LoaderFunction = async () => {
  const tasks = await prisma.task.findMany({
    select: { id: true, category: true },
  });

  return json(tasks);
};

export default function TaskCategories() {
  const tasks = useLoaderData<{ id: string; category: string }[]>();
  const fetcher = useFetcher<TaskResponse>();
  // Form reference
  const formRef = useRef<HTMLFormElement>(null);

  const [error, setError] = useState<string | null>(null);

  // Form reset & error handle
  useEffect(() => {
    if (fetcher.state === "idle") {
      formRef.current?.reset();
      if (fetcher.data?.error) {
        setError(fetcher.data.error);
      } else {
        setError(null);
      }
    }
  }, [fetcher.state, fetcher.data]);
  return (
    <div className="h-screen relative w-full bg-black flex  justify-center  overflow-hidden ">
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      <div className="mt-6 w-[50%] max-lg:w-[60%] flex flex-col items-center z-30">
        <h1 className="text-4xl max-md:text-2xl text-center text-white">
          Task Categories
        </h1>
        <div className=" my-6 w-full ">
          <fetcher.Form method="post" ref={formRef} className="flex">
            <input
              type="text"
              name="category"
              placeholder="Add category"
              required
              className="w-full rounded-2xl p-2 text-center caret-white border border-[#645f5f] hover:border-[#afa3a3]
                 "
            />
            <input type="hidden" name="actionType" value="add" />

            <button type="submit" className="self-start m-2">
              <i className="ri-add-large-fill text-white text-[18px] p-1 hover:text-black hover:bg-white rounded-full"></i>{" "}
            </button>
          </fetcher.Form>
          {error && <p className="text-red-600">{error}</p>}
        </div>

        <div className="w-full">
          {" "}
          {tasks && tasks.length > 0 ? (
            <ol className="list-decimal list-inside text-white">
              {tasks.map((task, index) => (
                <li
                  key={task.id}
                  className="text-xl flex items-center justify-between"
                >
                  <div className="px-2 ">{index + 1}.</div>
                  <div className="flex justify-between w-full">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-white text-xl transition-transform duration-200 inline-block hover:scale-105 "
                    >
                      {task.category
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join(" ")}
                    </Link>
                    {/* Delete button */}
                    <fetcher.Form method="post" className="mr-2">
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="actionType" value="delete" />
                      <button type="submit" className="  ">
                        <i className="ri-subtract-line text-white text-[24px] hover:text-black hover:bg-white rounded-full "></i>
                      </button>
                    </fetcher.Form>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-white">No categories available!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const category = formData.get("category") as string;
  const taskId = formData.get("taskId") as string;
  const actionType = formData.get("actionType") as string;

  if (actionType === "delete") {
    if (!taskId) {
      return json({ error: "Task ID is required" }, { status: 400 });
    }

    try {
      await prisma.task.delete({
        where: { id: taskId },
      });
      return json({ success: true });
    } catch (error) {
      return json(
        { error: "Task not found or could not be deleted" },
        { status: 400 }
      );
    }
  }

  // Handle adding task
  if (!category) {
    return json({ error: "Category is required" }, { status: 400 });
  }

  const normalizedCategory = category.toLowerCase();
  const taskExists = await prisma.task.count({
    where: { category: normalizedCategory },
  });

  if (taskExists > 0) {
    return json({ error: "Task already exists" }, { status: 400 });
  }

  const newTask = await prisma.task.create({
    data: { category: normalizedCategory },
  });

  return json(newTask);
};

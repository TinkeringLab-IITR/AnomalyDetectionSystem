import ProcessStat from "@/components/statss"

const StatPage = ({ params }) => {
  const { pid } = params;

  return (
    <ProcessStat pid={parseInt(pid)} />
  );
}

export default StatPage;
